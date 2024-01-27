using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManager.Models.SettingsModels;
using ReportManager.Services;
using System.ComponentModel.DataAnnotations;

namespace ReportManager.API
{
    [ApiController]
    [Route("api/{controller}")]
    public class GroupController : ControllerBase
    {
        private readonly GroupManagementService _groupManagementService;
        private readonly FolderManagementService _folderManagementService;
        private readonly UserManagementService _userManagementService;
        private readonly SharedService _sharedService;

        public GroupController(GroupManagementService groupManagementService, FolderManagementService folderManagementService, 
            UserManagementService userManagementService, SharedService sharedService)
        {
            _groupManagementService = groupManagementService;
            _folderManagementService = folderManagementService;
            _userManagementService = userManagementService;
            _sharedService = sharedService;
        }

        public class CreateGroupRequest
        {
            [Required]
            public string groupname { get; set; }
            [Required]
            public string username { get; set; }
            [Required]
            public string parentGroupId { get; set; }
            public List<string>? additionalOwners { get; set; }
            public List<string>? additionalMembers { get; set; }
        }

        public class UpdateGroupRequest
        {
            [Required]
            public string groupname { get; set; }
            [Required]
            public string username { get; set; }
            public List<string> owners { get; set; }
            public List<string> members { get; set; }
            public List<string> folders { get; set; }
            public List<string> connections { get; set; }
        }

        [HttpPost("createGroup")]
        public IActionResult CreateGroup(CreateGroupRequest request)
        {
            try
            {
                ObjectId parsedId = _sharedService.StringToObjectId(request.parentGroupId);
                _Group parentGroup = _groupManagementService.GetGroup(parsedId);
                FolderModel parent = _folderManagementService.GetFolderById(parentGroup.Folders[0]);
                string folderPath = parent.FolderPath + "/" + request.groupname + "/";

                FolderModel folder = new FolderModel
                {
                    FolderName = request.groupname,
                    FolderPath = folderPath,
                    ParentId = parent.Id,
                    IsObjectFolder = true
                };

                _folderManagementService.CreateFolder(folder);

                HashSet<string> owners = new HashSet<string> { request.username };
                HashSet<string> members = new HashSet<string> { request.username };

                if (request.additionalOwners != null)
                {
                    foreach (var owner in request.additionalOwners)
                    {
                        owners.Add(owner);
                    }
                }

                if (request.additionalMembers != null)
                {
                    foreach (var member in request.additionalMembers)
                    {
                        members.Add(member);
                    }
                }

                _Group group = new _Group
                {
                    GroupName = request.groupname,
                    GroupOwners = owners.ToList(),
                    GroupMembers = members.ToList(),
                    Folders = new List<ObjectId> { folder.Id },
                    IsTopGroup = false
                };

                _groupManagementService.CreateGroup(group);
                return Ok(new { message = "Group created successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("getTopGroup")]
        public string getTopGroup()
        {
            return _groupManagementService.GetTopGroup().Id.ToString();
        }

        [HttpPost("updateGroup")]
        public IActionResult UpdateGroup(UpdateGroupRequest request)
        {
            var mappedGroup = _sharedService.MapObjectToModel<_Group>(request);
            return _groupManagementService.UpdateGroup(mappedGroup) ? Ok("Group updated.") : BadRequest("Update failed.");
        }

        [HttpPost("leaveGroup")]
        public IActionResult LeaveGroup(string groupId, string username)
        {
            var groupObjId = _sharedService.StringToObjectId(groupId);
            var user = _userManagementService.GetUserByUsername(username);
            return _groupManagementService.RemoveUserFromGroup(groupObjId, username) ? Ok("User removed from group.") : BadRequest("Update failed.");
        }

        [HttpGet("GetUserGroups")]
        public IActionResult GetUserGroups(string username)
        {
            List<_Group> groups = _groupManagementService.GetGroupsByUser(username);
            List<GroupDTO> groupDTOs = groups.Select(g => new GroupDTO(g)).ToList();
            return Ok(groupDTOs);
        }

        [HttpGet("GetGroupById")]
        public ActionResult<GroupDTO> GetGroup(string groupId)
        {
            if (!ObjectId.TryParse(groupId, out var objectId))
            {
                return BadRequest("Invalid group ID.");
            }

            var group = _groupManagementService.GetGroup(objectId);
            if (group == null)
            {
                return NotFound($"Group with ID {groupId} not found.");
            }

            var groupDTO = new GroupDTO(group);
            return Ok(groupDTO);
        }
    }
}
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
            public string parentId { get; set; }
            public List<string> additionalOwners { get; set; }
            public List<string> additionalMembers { get; set; }
        }

        [HttpPost("createGroup")]
        public IActionResult CreateGroup(CreateGroupRequest request)
        {
            try
            {
                ObjectId parsedId = _sharedService.StringToObjectId(request.parentId);
                FolderModel parent = _folderManagementService.GetFolderById(parsedId);
                string folderPath = parent.FolderPath + "/" + request.groupname + "/";

                FolderModel folder = new FolderModel
                {
                    FolderName = request.groupname,
                    FolderPath = folderPath,
                    ParentId = parsedId
                };

                _folderManagementService.CreateFolder(folder);

                User initialUser = _userManagementService.GetUserByUsername(request.username);

                List<ObjectId> owners = new List<ObjectId> { initialUser.Id };
                List<ObjectId> members = new List<ObjectId> { initialUser.Id };

                if (request.additionalOwners != null)
                {
                    owners.AddRange(request.additionalOwners.Select(x => _userManagementService.GetUserByUsername(x).Id));
                }

                if (request.additionalMembers != null)
                {
                    members.AddRange(request.additionalMembers.Select(x => _userManagementService.GetUserByUsername(x).Id));
                }

                _Group group = new _Group
                {
                    GroupName = request.groupname,
                    GroupOwners = owners,
                    GroupMembers = members,
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
            return _groupManagementService.RemoveUserFromGroup(groupObjId, user.Id) ? Ok("User removed from group.") : BadRequest("Update failed.");
        }

        [HttpGet("getUserGroups")]
        public IActionResult GetUserGroups(ObjectId id)
        {
            List<_Group> groups = _groupManagementService.GetGroupsByUser(id);
            return Ok(groups);
        }
    }
}
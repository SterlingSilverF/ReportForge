using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManager.Models.SettingsModels;
using ReportManager.Services;
using System.ComponentModel.DataAnnotations;
using System.Configuration;

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
        private readonly IConfiguration _configuration;
        private string basePath;

        public GroupController(GroupManagementService groupManagementService, FolderManagementService folderManagementService, 
            UserManagementService userManagementService, SharedService sharedService, IConfiguration configuration)
        {
            _groupManagementService = groupManagementService;
            _folderManagementService = folderManagementService;
            _userManagementService = userManagementService;
            _sharedService = sharedService;
            _configuration = configuration;
            var basePathValue = _configuration.GetValue<string>("BasePath");
            basePath = (basePathValue == null) ? "C:/ReportForge/" : basePathValue;
        }

        public class CreateGroupRequest
        {
            [Required]
            public string GroupName { get; set; }
            [Required]
            public string username { get; set; }
            public HashSet<string>? GroupOwners { get; set; }
            public HashSet<string>? GroupMembers { get; set; }
        }

        public class UpdateGroupRequest
        {
            [Required]
            public string Id { get; set; }
            [Required]
            public string GroupName { get; set; }
            [Required]
            public HashSet<string> GroupOwners { get; set; }
            [Required]
            public HashSet<string> GroupMembers { get; set; }
            [Required]
            public HashSet<string> Folders { get; set; }
            public HashSet<string>? GroupConnectionStrings { get; set; }
        }

        [HttpPost("createGroup")]
        public IActionResult CreateGroup([FromBody] CreateGroupRequest request)
        {
            try
            {
                _Group topGroup = _groupManagementService.GetTopGroup();
                ObjectId topGroupId = topGroup.Id;
                FolderModel topGroupFolder = _folderManagementService.GetFolderById(topGroup.Folders.First(), false);
                string folderPath = basePath + "Groups/" + topGroup.GroupName + "/" + request.GroupName + "/";

                FolderModel folder = new FolderModel
                {
                    FolderName = request.GroupName,
                    FolderPath = folderPath,
                    ParentId = topGroupFolder.Id,
                    IsObjectFolder = true
                };

                if (!_folderManagementService.CreateDBFolder(folder))
                {
                    return BadRequest(new { message = "Failed to create the group folder." });
                }

                HashSet<string> owners = new HashSet<string> { request.username };
                owners.UnionWith(request.GroupOwners ?? Enumerable.Empty<string>());

                HashSet<string> members = new HashSet<string> { request.username };
                members.UnionWith(request.GroupMembers ?? Enumerable.Empty<string>());

                _Group group = new _Group
                {
                    GroupName = request.GroupName,
                    GroupOwners = owners,
                    GroupMembers = members,
                    Folders = new HashSet<ObjectId> { folder.Id },
                    IsTopGroup = false,
                    ParentId = topGroupId
                };

                _groupManagementService.CreateGroup(group);

                return Ok(new { message = "Group created successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "An error occurred: " + ex.Message });
            }
        }

        [HttpGet("getTopGroup")]
        public string getTopGroup()
        {
            return _groupManagementService.GetTopGroup().Id.ToString();
        }

        [HttpPut("updateGroup")]
        public IActionResult UpdateGroup([FromBody] UpdateGroupRequest request)
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
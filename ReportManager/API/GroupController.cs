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

        public class CreateGroupRequest
        {
            [Required]
            public string GroupId { get; set; }
            [Required]
            public string groupname { get; set; }
            [Required]
            public string username { get; set; }
            public string? parentId { get; set; }
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

        public GroupController(GroupManagementService groupManagementService, FolderManagementService folderManagementService, 
            UserManagementService userManagementService, SharedService sharedService)
        {
            _groupManagementService = groupManagementService;
            _folderManagementService = folderManagementService;
            _userManagementService = userManagementService;
            _sharedService = sharedService;
        }

        [HttpPost("createGroup")]
        public IActionResult CreateGroup(CreateGroupRequest request)
        {
            try
            {
                FolderModel folder = new FolderModel();
                if (request.parentId != null)
                {
                    string folderPath = "/" + request.groupname;
                    folder.FolderName = request.groupname;
                    folder.FolderPath = folderPath;
                    _folderManagementService.CreateFolder(folder);
                }
                else
                {
                    ObjectId parsedId = _sharedService.StringToObjectId(request.parentId);
                    FolderModel parent = _folderManagementService.GetFolderById(parsedId);
                    string folderPath = parent.FolderPath + "/" + request.groupname + "/";

                    folder.FolderName = request.groupname;
                    folder.FolderPath = folderPath;
                    folder.ParentId = parsedId;
                    _folderManagementService.CreateFolder(folder);
                }

                User user = _userManagementService.GetUserByUsername(request.username);
                _Group group = new _Group
                {
                    GroupName = request.groupname,
                    GroupOwners = { user.Id },
                    GroupMembers = { user.Id },
                    Folders = { folder.Id },
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
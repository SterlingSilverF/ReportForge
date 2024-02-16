using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManager.Services;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using MongoDB.Driver;
using Microsoft.IdentityModel.Tokens;

namespace ReportManager.API
{
    [ApiController]
    [Route("api/{controller}")]
    public class FolderController : ControllerBase
    {
        private readonly FolderManagementService _folderManagementService;
        private readonly SharedService _sharedService;
        private readonly UserManagementService _userManagementService;
        private readonly GroupManagementService _groupManagementService;

        public class CreateFolderRequest
        {
            [Required]
            public string FolderName { get; set; }
            [Required]
            public string Username { get; set; }
            public string? ParentId { get; set; }
            public string GroupId { get; set; }
            [Required]
            public bool IsGroupFolder { get; set; }
        }

        public class UpdateFolderRequest
        {
            [Required]
            public string FolderName { get; set; }
            public string FolderPath { get; set; }
        }

        public FolderController(FolderManagementService folderManagementService, UserManagementService userManagementService,
            SharedService sharedService, GroupManagementService groupManagementService)
        {
            _folderManagementService = folderManagementService;
            _userManagementService = userManagementService;
            _sharedService = sharedService;
            _groupManagementService = groupManagementService;
        }

        [HttpPost("createFolder")]
        public IActionResult CreateFolder(CreateFolderRequest request)
        {
            try
            {
                User user = _userManagementService.GetUserByUsername(request.Username);
                if (user == null)
                {
                    return BadRequest("User not found.");
                }

                FolderModel folder = new FolderModel
                {
                    FolderName = request.FolderName,
                    IsObjectFolder = false
                };

                if (!request.ParentId.IsNullOrEmpty())
                {
                   ObjectId parentId = _sharedService.StringToObjectId(request.ParentId);
                    folder.ParentId = parentId;
                    FolderModel parent = _folderManagementService.GetFolderById(parentId);
                    folder.FolderPath = parent.FolderPath + request.FolderName + "/";
                }
                else
                {
                    folder.ParentId = _folderManagementService.GetUserFolder(request.Username).Id;
                }

                if (request.IsGroupFolder)
                {
                    _folderManagementService.CreateDBFolder(folder);
                    ObjectId groupId = _sharedService.StringToObjectId(request.GroupId);
                    _groupManagementService.AddFolderToGroup(groupId, folder.Id);
                }
                else
                {
                    folder = new PersonalFolder
                    {
                        FolderName = folder.FolderName,  // Retain all previous properties
                        ParentId = folder.ParentId,  
                        FolderPath = folder.FolderPath,
                        IsObjectFolder = folder.IsObjectFolder,
                        Owner = user.Id
                    };
                    _folderManagementService.CreateDBPersonalFolder(folder as PersonalFolder);
                }

                return Ok(new { message = "Folder created successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("deleteFolder/{folderId}")]
        public IActionResult DeleteFolder(string folderId)
        {
            try
            {
                ObjectId objectId = new ObjectId(folderId);
                bool isDeleted = _folderManagementService.DeleteDBFolder(objectId);

                if (isDeleted)
                {
                    return Ok(new { message = "Folder deleted successfully." });
                }
                else
                {
                    return BadRequest("Could not delete the folder.");
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("updateFolder")]
        public IActionResult UpdateFolder(UpdateFolderRequest request)
        {
            var mappedFolder = _sharedService.MapObjectToModel<FolderModel>(request);
            return _folderManagementService.UpdateDBFolder(mappedFolder) ? Ok("Folder updated.") : BadRequest("Update failed.");
        }

        [HttpGet("getPersonalFolders")]
        public IActionResult GetPersonalFolders(string username)
        {
            var user = _userManagementService.GetUserByUsername(username);
            var personalFolders = _folderManagementService.GetPersonalFoldersByUser(user.Id);
            return Ok(personalFolders);
        }

        [HttpGet("getFoldersByGroupId")]
        public IActionResult GetFoldersByGroupId(string groupId)
        {
            var id = _sharedService.StringToObjectId(groupId);
            var folderModels = _folderManagementService.GetFoldersByGroup(id);

            if (folderModels == null || !folderModels.Any())
            {
                return NotFound("No folders found for the given group ID.");
            }

            var folderDTOs = folderModels.Select(model => new FolderDTO(model)).ToList();
            return Ok(folderDTOs);
        }

        [HttpGet("getSubFoldersByParentId")]
        public ActionResult<List<FolderModel>> GetSubFoldersByParentId([FromQuery] string parentId)
        {
            try
            {
                ObjectId parentIdObj;
                if (parentId == "null")
                {
                    parentIdObj = _groupManagementService.GetTopGroup().Folders.FirstOrDefault();
                }
                else
                {
                    parentIdObj = new ObjectId(parentId);
                }
                var subFolders = _folderManagementService.GetSubFoldersByParentId(parentIdObj);
                List<FolderDTO> dtos = subFolders.Select(folder => new FolderDTO(folder)).ToList();
                return Ok(dtos);
            }
            catch
            {
                return BadRequest("Invalid Parent ID");
            }
        }

        [HttpGet("getAllUserFolders")]
        public IActionResult GetAllUserFolders(string username)
        {
            var user = _userManagementService.GetUserByUsername(username);
            List<FolderModel> allFolders = new List<FolderModel>();

            // Get personal folders
            var personalFolders = _folderManagementService.GetPersonalFoldersByUser(user.Id);
            allFolders.AddRange(personalFolders.Cast<FolderModel>());

            // Get group folders
            var groups = _groupManagementService.GetGroupsByUser(username);
            foreach (var group in groups)
            {
                var groupFolders = _folderManagementService.GetFoldersByGroup(group.Id);
                allFolders.AddRange(groupFolders);
            }

            return Ok(allFolders);
        }
    }
}
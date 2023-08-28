using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManager.Services;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

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
        }

        public class UpdateFolderRequest
        {
            [Required]
            public string FolderName { get; set; }
            public string FolderPath { get; set; }
        }

        public FolderController(FolderManagementService folderManagementService, UserManagementService userManagementService, SharedService sharedService)
        {
            _folderManagementService = folderManagementService;
            _userManagementService = userManagementService;
            _sharedService = sharedService;
        }

        [HttpPost("createFolder")]
        public IActionResult CreateFolder(CreateFolderRequest request)
        {
            try
            {
                User user = _userManagementService.GetUserByUsername(request.Username);
                FolderModel folder = new FolderModel
                {
                    FolderName = request.FolderName,
                };

                if (request.ParentId != null)
                {
                    folder.ParentId = _sharedService.StringToObjectId(request.ParentId);
                }

                _folderManagementService.CreateFolder(folder);
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
                bool isDeleted = _folderManagementService.DeleteFolder(objectId);

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
            return _folderManagementService.UpdateFolder(mappedFolder) ? Ok("Folder updated.") : BadRequest("Update failed.");
        }

        [HttpGet("getUserFolders")]
        public IActionResult GetUserFolders(string username)
        {
            var user = _userManagementService.GetUserByUsername(username);
            var personalFolders = _folderManagementService.GetPersonalFoldersByUser(user.Id);
            return Ok(personalFolders);
        }

        [HttpGet("getUserGroupFolders")]
        public IActionResult GetUserGroupFolders(string username)
        {
            var user = _userManagementService.GetUserByUsername(username);
            var groups = _groupManagementService.GetGroupsByUser(user.Id);
            List<FolderModel> groupFolders = new List<FolderModel>();

            foreach (var group in groups)
            {
                var folders = _folderManagementService.GetFoldersByGroup(group.Id);
                groupFolders.AddRange(folders);
            }

            return Ok(groupFolders);
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
            var groups = _groupManagementService.GetGroupsByUser(user.Id);
            foreach (var group in groups)
            {
                var groupFolders = _folderManagementService.GetFoldersByGroup(group.Id);
                allFolders.AddRange(groupFolders);
            }

            return Ok(allFolders);
        }
    }
}
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManager.Services;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using MongoDB.Driver;
using Microsoft.IdentityModel.Tokens;
using static ReportManager.API.ReportController;
using System.Text;

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

            public string FolderType { get; set; }

            public string Id { get; set; }

            public string ParentId { get; set; }

            public bool IsGroupFolder { get; set; }

            public string OwnerId { get; set; }
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
        public async Task<IActionResult> CreateFolder(CreateFolderRequest request)
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
                    FolderModel parent = await _folderManagementService.GetFolderById(parentId, false);
                    folder.FolderPath = parent.FolderPath + request.FolderName + "/";
                }
                else
                {
                    PersonalFolder _userFolder = _folderManagementService.GetUserFolder(request.Username);
                    folder.ParentId = _userFolder.Id;
                    folder.FolderPath = _userFolder.FolderPath + request.FolderName + "/";
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

        [HttpDelete("deleteFolder")]
        public async Task<IActionResult> DeleteFolder(string folderId, bool isPersonal)
        {
            try
            {
                ObjectId objectId = new ObjectId(folderId);
                bool isDeleted = await _folderManagementService.DeleteDBFolder(objectId, isPersonal);

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

        [HttpPut("updateFolder")]
        public async Task<IActionResult> UpdateFolder([FromBody] UpdateFolderRequest request)
        {
            var mappedFolder = _sharedService.MapObjectToModel<FolderModel>(request);
            var updateResult = await _folderManagementService.UpdateDBFolder(mappedFolder);
            return updateResult ? Ok("Folder updated.") : BadRequest("Update failed.");
        }

        [HttpGet("getPersonalFolders")]
        public IActionResult GetPersonalFolders(string username)
        {
            var user = _userManagementService.GetUserByUsername(username);
            var personalFolders = _folderManagementService.GetPersonalFoldersByUser(user.Id);
            var personalFolderDTOs = personalFolders.Select(model => new FolderDTO(model));
            return Ok(personalFolderDTOs);
        }

        [HttpGet("getPersonalFolder")]
        public IActionResult GetPersonalFolder(string username)
        {
            var user = _userManagementService.GetUserByUsername(username);
            var personalFolder = _folderManagementService.GetUserFolder(username);
            var personalFolderDTO = new FolderDTO(personalFolder);
            return Ok(personalFolderDTO);
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
        public ActionResult<List<FolderModel>> GetSubFoldersByParentId(string parentId, string type)
        {
            try
            {
                ObjectId parentIdObj;
                if (parentId == "TOP")
                {
                    parentIdObj = _groupManagementService.GetTopGroup().Folders.FirstOrDefault();
                }
                else
                {
                    parentIdObj = new ObjectId(parentId);
                }
                var subFolders = _folderManagementService.GetSubFoldersByParentId(parentIdObj, type);
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
            List<FolderDTO> allFolders = new List<FolderDTO>();

            var personalFolders = _folderManagementService.GetPersonalFoldersByUser(user.Id);
            allFolders.AddRange(personalFolders.Select(model => new FolderDTO(model)));

            var groups = _groupManagementService.GetGroupsByUser(username);
            foreach (var group in groups)
            {
                var groupFolders = _folderManagementService.GetFoldersByGroup(group.Id);
                allFolders.AddRange(groupFolders.Select(model => new FolderDTO(model)));
            }

            return Ok(allFolders);
        }

        [HttpGet("getFolderById")]
        public async Task<ActionResult<FolderDTO>> GetFolderById(ObjectId folderId, bool isPersonal)
        {
            try
            {
                var folder = await _folderManagementService.GetFolderById(folderId, isPersonal);
                if (folder != null)
                {
                    return Ok(new FolderDTO(folder));
                }
                else
                {
                    return BadRequest("Folder not found.");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("GetFilesInFolder")]
        public ActionResult<List<string>> GetFilesListInFolder(string folderPath, DateTime? startDate, DateTime? endDate)
        {
            try
            {
                if (folderPath.StartsWith(@"//"))
                {
                    string serverName = folderPath.Split('/', StringSplitOptions.RemoveEmptyEntries)[0];
                    folderPath = folderPath.Replace($"//{serverName}", @"C:\");
                }

                if (!Directory.Exists(folderPath))
                {
                    return NotFound("Folder does not exist.");
                }

                string[] filePaths = Directory.GetFiles(folderPath);
                List<string> filteredFileNames = new List<string>();
                foreach (string filePath in filePaths)
                {
                    DateTime fileEditDate = System.IO.File.GetLastWriteTime(filePath);
                    if ((!startDate.HasValue || fileEditDate >= startDate.Value) && (!endDate.HasValue || fileEditDate <= endDate.Value))
                    {
                        filteredFileNames.Add(Path.GetFileName(filePath));
                    }
                }

                return Ok(filteredFileNames);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error occurred while retrieving files: {ex.Message}");
            }
        }

        [HttpGet("DownloadFile")]
        public IActionResult DownloadFile(string filePath)
        {
            if (System.IO.File.Exists(filePath))
            {
                byte[] fileContents = System.IO.File.ReadAllBytes(filePath);
                string contentType = _folderManagementService.GetContentType(filePath);
                return File(fileContents, contentType, Path.GetFileName(filePath));
            }
            else
            {
                return NotFound("File not found");
            }
        }
    }
}
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManager.Services;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using Org.BouncyCastle.Asn1.Ocsp;

namespace ReportManager.API
{
    [ApiController]
    [Route("api/{controller}")]
    public class ReportController : ControllerBase
    {
        private readonly ReportManagementService _reportManagementService;
        private readonly GroupManagementService _groupManagementService;
        private readonly SharedService _sharedService;
        private readonly FolderManagementService _folderManagementService;

        public class CreateReportRequest
        {
            [Required]
            public string _userId { get; set; }
            [Required]
            public string ReportName { get; set; }
            public string Description { get; set; }
            [Required]
            public DBConnectionModel SourceDB { get; set; }
            [Required]
            public ScheduleInfo Schedule { get; set; }
            [Required]
            public int PaginationLimit { get; set; }
            [Required]
            public string FolderId { get; set; }
            [Required]
            public bool IsGroupReport { get; set; }
            [Required]
            public string Action { get; set; }
            [Required]
            public string OwnerId { get; set; }
            [Required]
            public string OwnerType { get; set; }
        }

        public class CreateNormalReport : CreateReportRequest
        {
            [Required]
            public HashSet<DatabaseObjectInfoModel> SelectedObjects { get; set; }
            [Required]
            public List<ReportColumn> Columns { get; set; }
            public List<Filter> Filters { get; set; }
            [Required]
            public List<string> OrderBy { get; set; }
        }

        public class CreateSQLReport : CreateReportRequest
        {
            public string CustomSQL { get; set; }
        }

        public class ReportSubsetRequest
        {
            [Required]
            public string OwnerId { get; set; }
            [Required]
            public string ReportType { get; set; }
        }

        public ReportController(ReportManagementService reportManagementService, UserManagementService userManagementService, 
            GroupManagementService groupManagementService, SharedService sharedService, FolderManagementService folderManagementService)
        {
            _reportManagementService = reportManagementService;
            _groupManagementService = groupManagementService;
            _sharedService = sharedService;
            _folderManagementService = folderManagementService;
        }

        [HttpPost("createOrUpdateNormalReport")]
        public IActionResult CreateOrUpdateNormalReport(CreateNormalReport request)
        {
            ObjectId folderid = _sharedService.StringToObjectId(request.FolderId);
            var folder = _folderManagementService.GetFolderById(folderid);
            ObjectId _userId = _sharedService.StringToObjectId(request._userId);
            if (folder == null)
            {
                return BadRequest("Invalid Folder ID");
            }
            try
            {
                OwnerType ownerType = Enum.TryParse(request.OwnerType, true, out OwnerType parsedType) ? parsedType : default(OwnerType);

                var report = new NormalReportConfiguration
                {
                    ReportName = request.ReportName,
                    Description = request.Description,
                    SourceDB = request.SourceDB,
                    Schedule = request.Schedule,
                    PaginationLimit = request.PaginationLimit,
                    FolderId = folder.Id,
                    CreatorId = _userId,
                    CreatedDate = DateTime.Now,
                    LastModifiedDate = DateTime.Now,
                    LastModifiedBy = _userId,
                    SelectedObjects = request.SelectedObjects,
                    Columns = request.Columns,
                    Filters = request.Filters,
                    OrderBy = request.OrderBy,
                    OwnerID = _sharedService.StringToObjectId(request.OwnerId),
                    OwnerType = ownerType
                };

                ReportType reportType = request.IsGroupReport ? ReportType.Group : ReportType.Personal;

                if (request.Action == "Create")
                {
                    _reportManagementService.CreateReport(report, reportType);
                }
                else if (request.Action == "Update")
                {
                    _reportManagementService.UpdateReport(report, reportType);
                }
                else
                {
                    return BadRequest($"Unknown action: {request.Action}");
                }
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.ToString());
            }
        }

        [HttpPost("createOrUpdateSQLReport")]
        public IActionResult CreateOrUpdateSQLReport(CreateSQLReport request)
        {
            ObjectId folderid = _sharedService.StringToObjectId(request.FolderId);
            var folder = _folderManagementService.GetFolderById(folderid);
            ObjectId _userId = _sharedService.StringToObjectId(request._userId);
            if (folder == null)
            {
                return BadRequest("Invalid Folder ID");
            }
            try
            {
                var report = new CustomSQLReport
                {
                    ReportName = request.ReportName,
                    Description = request.Description,
                    SourceDB = request.SourceDB,
                    Schedule = request.Schedule,
                    PaginationLimit = request.PaginationLimit,
                    FolderId = folder.Id,
                    CreatorId = _userId,
                    CreatedDate = DateTime.Now,
                    LastModifiedDate = DateTime.Now,
                    LastModifiedBy = _userId,
                    CustomSQL = request.CustomSQL
                };

                ReportType reportType = request.IsGroupReport ? ReportType.Group : ReportType.Personal;

                if (request.Action == "Create")
                {
                    _reportManagementService.CreateReport(report, reportType);
                }
                else if (request.Action == "Update")
                {
                    _reportManagementService.UpdateReport(report, reportType);
                }
                else
                {
                    return BadRequest($"Unknown action: {request.Action}");
                }
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.ToString());
            }
        }

        [HttpGet("getUserReports")]
        public IActionResult GetUserReports([FromQuery] string userId)
        {
            ObjectId _userId = _sharedService.StringToObjectId(userId);
            var reports = _reportManagementService.GetPersonalReportsByCreatorId(_userId);
            return Ok(reports);
        }

        [HttpPost("GetReportCount")]
        public int GetReportCount(ReportSubsetRequest subset)
        {
            ReportType reportType = (ReportType)Enum.Parse(typeof(ReportType), subset.ReportType);
            var reports = _reportManagementService.GetReportsByOwnerId(_sharedService.StringToObjectId(subset.OwnerId), reportType);
            return reports.Count;
        }

        [HttpGet("getFolderReports")]
        public IActionResult GetFolderReports([FromQuery] string folderId, [FromQuery] bool isPersonal)
        {
            ObjectId folderObjectId;
            // If none specified, do highest group folder
            if (folderId == "null")
            {
                var group = _groupManagementService.GetTopGroup();
               folderObjectId = group.Folders.FirstOrDefault();
            }
            else {
                folderObjectId = _sharedService.StringToObjectId(folderId);
            }
            
            var folder = _folderManagementService.GetFolderById(folderObjectId);
            if (folder == null)
            {
                return BadRequest("Invalid Folder ID");
            }

            List<ReportConfigurationModel> reports;
            try
            {
                ReportType reportType = isPersonal ? ReportType.Personal : ReportType.Group;
                reports = _reportManagementService.GetReportsByFolder(folderObjectId, reportType);
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred: {ex.ToString()}");
            }

            return Ok(reports);
        }
    }
}
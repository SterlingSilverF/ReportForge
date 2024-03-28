using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManager.Services;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using Org.BouncyCastle.Asn1.Ocsp;
using System.Runtime.InteropServices;
using static ReportManager.Models.SQL_Builder;
using MongoDB.Bson.IO;
using System.Text;
using Newtonsoft.Json;

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
        private readonly UserManagementService _userManagementService;

        public class BuildSQLRequest
        {
            public string SelectedConnection { get; set; }
            public string DbType { get; set; }
            public List<string> SelectedTables { get; set; } = new List<string>();
            public List<BaseColumnDefinition> SelectedColumns { get; set; } = new List<BaseColumnDefinition>();
            public List<JoinConfigItem> JoinConfig { get; set; } = new List<JoinConfigItem>();
            public List<FilterItem> Filters { get; set; } = new List<FilterItem>();
            public List<OrderByItem> OrderBys { get; set; } = new List<OrderByItem>();
        }

        public class ReportFormContextRequest : BuildSQLRequest
        {
            public string Action { get; set; }
            public string UserId { get; set; }
            public string ReportName { get; set; }
            public string ReportDescription { get; set; }
            public string ReportType { get; set; }
            public string? SelectedGroup { get; set; }
            public string SelectedFolder { get; set; }
            public new List<ColumnDefinitionDTO> SelectedColumns { get; set; } = new List<ColumnDefinitionDTO>();
            public string CompiledSQL { get; set; }
            public string OutputFormat { get; set; }
            public int ReportFrequencyValue { get; set; }
            public string ReportFrequencyType { get; set; }
            public string ReportGenerationTime { get; set; }
            public string EmailReports { get; set; }
            public string EmailRecipients { get; set; }
        }

        public class ReportSubsetRequest
        {
            [Required]
            public string OwnerId { get; set; }
            [Required]
            public string ReportType { get; set; }
        }

        public class ExportRequest
        {
            public string Format { get; set; }
            public string ReportName { get; set; }
            public string Data { get; set; }
        }

        public ReportInfoDTO MapReportToDTO(ReportConfigurationModel report, bool isPersonal)
        {
            string createdDateFormatted = FormatDateTime(report.CreatedDate);
            string lastModifiedDateFormatted = FormatDateTime(report.LastModifiedDate);

            if (isPersonal)
            {
                return new ReportInfoDTO
                {
                    Id = report.Id.ToString(),
                    ReportName = report.ReportName,
                    Description = report.Description,
                    CreatorName = _userManagementService.GetUsernameById(report.CreatorId),
                    CreatedDate = createdDateFormatted,
                    LastModifiedDate = lastModifiedDateFormatted,
                    LastModifiedByName = _userManagementService.GetUsernameById(report.LastModifiedBy),
                    OwnerName = _userManagementService.GetUsernameById(report.OwnerID),
                    OwnerType = report.OwnerType.ToString()
                };
            }
            else
            {
                var group = _groupManagementService.GetGroup(report.OwnerID);
                string groupName = group.GroupName;

                return new ReportInfoDTO
                {
                    Id = report.Id.ToString(),
                    ReportName = report.ReportName,
                    Description = report.Description,
                    CreatorName = _userManagementService.GetUsernameById(report.CreatorId),
                    CreatedDate = createdDateFormatted,
                    LastModifiedDate = lastModifiedDateFormatted,
                    LastModifiedByName = _userManagementService.GetUsernameById(report.LastModifiedBy),
                    OwnerName = groupName,
                    OwnerType = "Group"
                };
            }
        }

        /*private ReportFormContextRequest MapReportToFormContext(ReportConfigurationModel report)
        {
            return new ReportFormContextRequest
            {
                SelectedConnection = report.ConnectionStringId.ToString(),
                DbType = 
                SelectedTables = 
                SelectedColumns = 
                JoinConfig = 
                Filters = 
                OrderBys = 
                Action = "Update",
                UserId = report.CreatorId.ToString(),
                ReportName = report.ReportName,
                ReportDescription = report.Description,
                ReportType = report.OwnerType.ToString(),
                SelectedGroup = isPersonal ? null : report.OwnerID.ToString(),
                SelectedFolder = report.FolderId.ToString(),
                CompiledSQL = report.CompiledSQL,
                OutputFormat = report.
                ReportFrequencyValue = GetReportFrequencyValue(report),
                ReportFrequencyType = GetReportFrequencyType(report),
                ReportGenerationTime = GetReportGenerationTime(report),
                EmailReports = GetEmailReports(report),
                EmailRecipients = GetEmailRecipients(report)
            };
        }*/

        private string FormatDateTime(DateTime dateTime)
        {
            TimeZoneInfo systemTimeZone = TimeZoneInfo.Local;
            DateTime localDateTime = TimeZoneInfo.ConvertTimeFromUtc(dateTime, systemTimeZone);
            string formattedDateTime = localDateTime.ToString("yyyy-MM-dd HH:mm:ss");
            return formattedDateTime;
        }

        public class ReportSummaryDTO
        {
            public string Id { get; set; }
            public string ReportName { get; set; }
        }

        public ReportController(ReportManagementService reportManagementService, UserManagementService userManagementService,
            GroupManagementService groupManagementService, SharedService sharedService, FolderManagementService folderManagementService)
        {
            _reportManagementService = reportManagementService;
            _userManagementService = userManagementService;
            _groupManagementService = groupManagementService;
            _sharedService = sharedService;
            _folderManagementService = folderManagementService;
        }

        [HttpPost("ConfigureReport")]
        public IActionResult ConfigureReport([FromBody] ReportFormContextRequest request)
        {
            try
            {
                bool existing = request.Action.Equals("Create", StringComparison.OrdinalIgnoreCase) ? false : true;
                var reportModel = _reportManagementService.TransformRequestToModel(request, _sharedService, existing);
                if (existing)
                {
                    _reportManagementService.UpdateReport(reportModel, request.ReportType);
                }
                else
                {
                    _reportManagementService.CreateReport(reportModel, request.ReportType);
                }
                return Ok();
            }
            catch (Exception ex)
            {
                // TODO: Logging
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("buildAndVerifySQL")]
        public IActionResult BuildSQL([FromBody] BuildSQLRequest request)
        {
            string SQL = _reportManagementService.BuildSQLQuery(request);
            return Ok(SQL);
        }

        [HttpPost("exportReport")]
        public async Task<IActionResult> ExportReport([FromBody] ExportRequest request)
        {
            var reportName = request.ReportName;
            var reportData = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(request.Data);
            if (reportData == null)
            {
                return BadRequest("Invalid data format.");
            }

            byte[] fileBytes;
            string contentType;
            string fileName;

            switch (request.Format.ToLower())
            {
                case "csv":
                    fileBytes = _reportManagementService.GenerateCsv(reportData);
                    contentType = "text/csv";
                    fileName = $"{reportName}.csv";
                    break;
                case "excel":
                    fileBytes = _reportManagementService.GenerateXlsx(reportData, reportName);
                    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    fileName = $"{reportName}.xlsx";
                    break;
                case "pdf":
                    fileBytes = _reportManagementService.GeneratePdf(reportData, reportName);
                    contentType = "application/pdf";
                    fileName = $"{reportName}.pdf";
                    break;
                case "json":
                    fileBytes = Encoding.UTF8.GetBytes(request.Data);
                    contentType = "application/json";
                    fileName = $"{reportName}.json";
                    break;
                case "txt":
                    fileBytes = _reportManagementService.GenerateTxtPipeDelimited(reportData);
                    contentType = "text/plain";
                    fileName = $"{reportName}.txt";
                    break;
                default:
                    return BadRequest("Unsupported format.");
            }

            return File(fileBytes, contentType, fileName);
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
            var reports = _reportManagementService.GetReportsByOwnerId(_sharedService.StringToObjectId(subset.OwnerId), subset.ReportType);
            return reports.Count;
        }

        [HttpGet("getReportById")]
        public IActionResult GetReportById(string reportId, string type)
        {
            try
            {
                var reportObjectId = _sharedService.StringToObjectId(reportId);
                var report = _reportManagementService.GetReportById(reportObjectId, type);

                if (report == null)
                {
                    return NotFound();
                }

                bool isPersonal = type == "Personal";
                ReportInfoDTO reportInfoDTO = MapReportToDTO(report, isPersonal);
                return Ok(reportInfoDTO);
            }
            catch (Exception ex)
            {
                // TODO: Log the exception
                return StatusCode(500, "An internal server error occurred.");
            }
        }

        [HttpGet("getFolderReports")]
        public IActionResult GetFolderReports(string folderId, bool type)
        {
            ObjectId folderObjectId;
            if (folderId == "TOP")
            {
                var group = _groupManagementService.GetTopGroup();
                folderObjectId = group.Folders.FirstOrDefault();
            }
            else
            {
                folderObjectId = _sharedService.StringToObjectId(folderId);
            }

            var folder = _folderManagementService.GetFolderById(folderObjectId, type);
            if (folder == null)
            {
                return BadRequest("Invalid Folder ID");
            }

            List<ReportSummaryDTO> reportSummaries;
            try
            {
                var reports = _reportManagementService.GetReportsByFolder(folderObjectId, type);
                reportSummaries = reports.Select(r => new ReportSummaryDTO
                {
                    Id = r.Id.ToString(),
                    ReportName = r.ReportName
                }).ToList();
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred: {ex.ToString()}");
            }
            return Ok(reportSummaries);
        }
    }
}
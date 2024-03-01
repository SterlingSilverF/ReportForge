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

        public class BuildSQLRequest
        {
            public string SelectedConnection { get; set; }
            public string DbType { get; set; }
            public List<string> SelectedTables { get; set; } = new List<string>();
            public List<ColumnDefinition> SelectedColumns { get; set; } = new List<ColumnDefinition>();
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
            public string ?SelectedGroup { get; set; }
            public string SelectedFolder { get; set; }
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

        public ReportController(ReportManagementService reportManagementService, UserManagementService userManagementService, 
            GroupManagementService groupManagementService, SharedService sharedService, FolderManagementService folderManagementService)
        {
            _reportManagementService = reportManagementService;
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
                if (existing) {
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
        public async Task<IActionResult> ExportReport(string format, string reportname, string data)
        {
            var reportName = reportname + DateTime.Now;
            var reportData = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(data);
            if (reportData == null)
            {
                return BadRequest("Invalid data format.");
            }

            byte[] fileBytes;
            string contentType;
            string fileName;

            switch (format.ToLower())
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
                    fileBytes = Encoding.UTF8.GetBytes(data);
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

        [HttpGet("getFolderReports")]
        public IActionResult GetFolderReports(string folderId, bool type)
        {
            ObjectId folderObjectId;
            if (folderId == "TOP")
            {
                var group = _groupManagementService.GetTopGroup();
               folderObjectId = group.Folders.FirstOrDefault();
            }
            else {
                folderObjectId = _sharedService.StringToObjectId(folderId);
            }
            var folder = _folderManagementService.GetFolderById(folderObjectId, type);
            if (folder == null)
            {
                return BadRequest("Invalid Folder ID");
            }

            List<ReportConfigurationModel> reports;
            try
            {
                reports = _reportManagementService.GetReportsByFolder(folderObjectId, type);
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred: {ex.ToString()}");
            }

            return Ok(reports);
        }
    }
}
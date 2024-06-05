using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManager.Services;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using Org.BouncyCastle.Asn1.Ocsp;
using System.Runtime.InteropServices;
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

        public class ReportFormContext : BuildSQLRequest
        {
            public string? ReportId { get; set; }
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
            public int RetentionDays { get; set; }
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

        [HttpPost("CreateReport")]
        public IActionResult CreateReport([FromBody] ReportFormContext request)
        {
            try
            {
                var reportModel = _reportManagementService.TransformRequestToModel(request, _sharedService, false);
                _reportManagementService.CreateReport(reportModel, request.ReportType);
                return Ok();
            }
            catch (Exception ex)
            {
                // TODO: Logging
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPut("UpdateReport")]
        public IActionResult UpdateReport([FromBody] ReportFormContext request)
        {
            try
            {
                var reportModel = _reportManagementService.TransformRequestToModel(request, _sharedService, true);
                _reportManagementService.UpdateReport(reportModel, request.ReportType);
                return Ok();
            }
            catch (Exception ex)
            {
                // TODO: Logging
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpDelete("DeleteReport")]
        public async Task<IActionResult> DeleteReport(string reportId, string type)
        {
            try
            {
                var reportObjectId = _sharedService.StringToObjectId(reportId);
                var report = await _reportManagementService.GetReportById(reportObjectId, type);

                if (report == null)
                {
                    return NotFound();
                }

                bool isPersonal = type == "Personal";
                var folderPath = await _folderManagementService.BuildFolderPath(report.FolderId, isPersonal, false);

                // Delete all report files under this config
                var directoryInfo = new DirectoryInfo(folderPath);
                var reportFiles = directoryInfo.GetFiles($"{report.ReportName}_*.{report.Format.ToString()}");
                foreach (var file in reportFiles)
                {
                    file.Delete();
                }

                // Delete the report configuration itself
                _reportManagementService.DeleteReport(reportObjectId, type);
                return Ok("Report configuration and related files deleted successfully.");
            }
            catch (Exception ex)
            {
                // TODO: Logging
                return StatusCode(500, "An internal server error occurred.");
            }
        }

        [HttpPost("BuildAndVerifySQL")]
        public IActionResult BuildSQL([FromBody] BuildSQLRequest request)
        {
            string SQL = _reportManagementService.BuildSQLQuery(request);
            return Ok(SQL);
        }

        [HttpPost("ExportReport")]
        public async Task<IActionResult> ExportReport([FromBody] ExportRequest request)
        {
            try
            {
                var (fileBytes, contentType, fileName) = await _reportManagementService.ExportReportAsync(request);
                return File(fileBytes, contentType, fileName);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("GetUserReports")]
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

        [HttpGet("GetReportById")]
        public async Task<IActionResult> GetReportById(string reportId, string type, bool fullDataset = false)
        {
            try
            {
                var reportObjectId = _sharedService.StringToObjectId(reportId);
                var report = await _reportManagementService.GetReportById(reportObjectId, type);

                if (report == null)
                {
                    return NotFound();
                }
                bool isPersonal = type == "Personal";
                var folderPath = await _folderManagementService.BuildFolderPath(report.FolderId, isPersonal);

                if (fullDataset)
                {
                    var reportFormContext = _reportManagementService.TransformModelToRequest(report);
                    return Ok(reportFormContext);
                }
                else
                {
                    ReportInfoDTO reportInfoDTO = MapReportToDTO(report, isPersonal);
                    reportInfoDTO.FolderPath = folderPath;
                    return Ok(reportInfoDTO);
                }
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

        [HttpGet("GetAllUserRelatedReports")]
        public IActionResult GetAllUserRelatedReports(string userId)
        {
            try
            {
                ObjectId userIdObj = _sharedService.StringToObjectId(userId);
                var personalReports = _reportManagementService.GetPersonalReportsByCreatorId(userIdObj);
                var userGroups = _groupManagementService.GetGroupsByUser(userId);

                var groupReports = new List<ReportConfigurationModel>();
                foreach (var group in userGroups)
                {
                    var reportsForGroup = _reportManagementService.GetReportsByGroup(group.Id);
                    groupReports.AddRange(reportsForGroup);
                }

                var combinedReports = personalReports.Concat(groupReports).ToList();
                var reportDTOs = combinedReports.Select(report => MapReportToDTO(report, report.OwnerType == OwnerType.Personal)).ToList();

                return Ok(reportDTOs);
            }
            catch (Exception ex)
            {
                // TODO: Log the exception
                return StatusCode(500, "An internal server error occurred while fetching all related reports.");
            }
        }
    }
}
using MongoDB.Driver.Core.Connections;
using ReportManager.Services;
using static ReportManager.API.ReportController;
using System.Collections.Concurrent;
using MongoDB.Bson;
using ReportManager.Models;
using MongoDB.Driver;

namespace ReportDaemon
{
    public class Worker
    {
        private readonly ILogger<Worker> _logger;
        private readonly ConnectionService _connectionService;
        private readonly ReportManagementService _reportManagementService;
        private readonly SharedService _sharedService;
        private readonly EmailService _emailService;
        private readonly DatabaseService _databaseService;
        private readonly FolderManagementService _folderManagementService;
        private ConcurrentQueue<ReportRequest> _reportQueue;
        private static bool _isRunning = false;
        private static readonly object _lock = new object();

        public Worker(ILogger<Worker> logger, ConnectionService connectionService, ReportManagementService reportManagementService,
            SharedService sharedService, DatabaseService databaseService, EmailService emailService, FolderManagementService folderManagementService)
        {
            _logger = logger;
            _connectionService = connectionService;
            _reportManagementService = reportManagementService;
            _databaseService = databaseService;
            _sharedService = sharedService;
            _emailService = emailService;
            _folderManagementService = folderManagementService;
            _reportQueue = new ConcurrentQueue<ReportRequest>();
        }

        public async Task TriggerWorker(string taskType, CancellationToken cancellationToken)
        {
            lock (_lock)
            {
                if (_isRunning)
                {
                    _logger.LogInformation("Worker is already running. Exiting this instance.");
                    return;
                }
                _isRunning = true;
            }

            try
            {
                _logger.LogInformation("Worker triggered at: {time}", DateTimeOffset.Now);

                if (taskType == "report" || taskType == "both")
                {
                    await ProcessReportQueue(cancellationToken);
                    await ProcessScheduledReports(cancellationToken);
                }

                if (taskType == "cleanup" || taskType == "both")
                {
                    await RunRetentionCleanup(cancellationToken);
                }

                _logger.LogInformation("Worker completed at: {time}", DateTimeOffset.Now);
            }
            finally
            {
                lock (_lock)
                {
                    _isRunning = false;
                }
            }
        }

        public void EnqueueReportRequest(ReportRequest request)
        {
            _reportQueue.Enqueue(request);
            _logger.LogInformation("Enqueued report request: {reportId}", request.reportId);
        }

        private async Task ProcessReportQueue(CancellationToken stoppingToken)
        {
            while (_reportQueue.TryDequeue(out var request))
            {
                try
                {
                    _logger.LogInformation("Processing report request: {reportId}", request.reportId);
                    ObjectId reportId;
                    ObjectId connectionId;

                    if (!ObjectId.TryParse(request.reportId, out reportId))
                    {
                        _logger.LogError("Invalid reportId: {reportId}", request.reportId);
                        continue;
                    }
                    if (!ObjectId.TryParse(request.connectionId, out connectionId))
                    {
                        _logger.LogError("Invalid connectionId: {connectionId}", request.connectionId);
                        continue;
                    }

                    var connectionString = await _connectionService.FetchAndDecryptConnectionString(connectionId);
                    var reportModel = await _reportManagementService.GetReportById(reportId, request.reportType);
                    var reportData = await _databaseService.ExecuteSanitizedQuery(reportModel.DbType, connectionString, reportModel.CompiledSQL);

                    var exportRequest = new ExportRequest
                    {
                        ReportName = reportModel.ReportName,
                        Format = reportModel.Format.ToString(),
                        Data = Newtonsoft.Json.JsonConvert.SerializeObject(reportData)
                    };

                    var (fileBytes, contentType, fileName) = await _reportManagementService.ExportReportAsync(exportRequest);
                    var folderPath = request.folderPath;
                    var dateSuffix = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
                    var filePath = Path.Combine(folderPath, $"{Path.GetFileNameWithoutExtension(fileName)}_{dateSuffix}{Path.GetExtension(fileName)}");
                    await File.WriteAllBytesAsync(filePath, fileBytes);
                    _logger.LogInformation("Saved report file successfully: {filePath}", filePath);

                    var emailRecipients = request.semicolonSeparatedEmails.Split(';').Select(email => email.Trim()).ToList();
                    var emailSubject = $"Report: {request.reportName}";
                    var emailBody = $"Autogenerated report at {DateTime.Now}: {fileName}. File is attached.";

                    using (var memoryStream = new MemoryStream(fileBytes))
                    {
                        var emailAttachment = new EmailAttachment
                        {
                            Content = memoryStream,
                            ContentType = contentType,
                            FileName = fileName
                        };

                        await _emailService.SendEmailAsync(emailRecipients, emailSubject, emailBody, emailAttachment);
                        _logger.LogInformation("Sent email notifications for report: {reportId}", request.reportId);
                    }
                    _logger.LogInformation("Completed processing report request: {reportId}", request.reportId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing report request: {reportId}", request.reportId);
                }
            }
        }

        public async Task ProcessScheduledReports(CancellationToken cancellationToken)
        {
            var currentTime = DateTime.UtcNow;
            var scheduledReports = await _reportManagementService.GetScheduledReports(currentTime, cancellationToken);

            foreach (var report in scheduledReports)
            {
                var reportRequest = await BuildReportRequest(report);
                EnqueueReportRequest(reportRequest);
                _logger.LogInformation("Queued report: {reportId}", report.Id);
            }
        }

        private async Task<ReportRequest> BuildReportRequest(ReportConfigurationModel report)
        {
            var buildSqlRequest = new BuildSQLRequest
            {
                SelectedConnection = report.ConnectionStringId.ToString(),
                DbType = report.DbType,
                SelectedTables = report.SelectedColumns.Select(column => column.Table).Distinct().ToList(),
                SelectedColumns = report.SelectedColumns.Select(column => new BaseColumnDefinition
                {
                    Table = column.Table,
                    ColumnName = column.ColumnName,
                    DataType = column.DataType
                }).ToList(),
                JoinConfig = report.JoinConfig,
                Filters = report.Filters,
                OrderBys = report.OrderBys
            };

            string folderPath = await _folderManagementService.BuildFolderPath(report.FolderId, report.OwnerType == OwnerType.Personal);
            var reportRequest = new ReportRequest
            {
                reportId = report.Id.ToString(),
                reportName = report.ReportName,
                connectionId = report.ConnectionStringId.ToString(),
                reportType = report.OwnerType.ToString(),
                folderPath = folderPath,
                semicolonSeparatedEmails = string.Join(";", report.EmailRecipients),
                buildSqlRequest = buildSqlRequest
            };

            return reportRequest;
        }

        public async Task RunRetentionCleanup(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting retention scan at: {time}", DateTimeOffset.Now);

            try
            {
                var personalReportsTask = _reportManagementService.GetAllReports("Personal");
                var groupReportsTask = _reportManagementService.GetAllReports("Group");

                var personalReports = personalReportsTask;
                var groupReports = groupReportsTask;
                var allReports = personalReports.Concat(groupReports);

                foreach (var report in allReports)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        _logger.LogInformation("Cancellation requested. Exiting retention cleanup.");
                        break;
                    }

                    var creationDate = report.CreatedDate;
                    var retentionDays = report.RetentionDays;

                    if (retentionDays > 0 && (DateTime.UtcNow - creationDate).TotalDays > retentionDays)
                    {
                        _logger.LogInformation("Deleting report file for reportId {reportId} due to retention policy", report.Id);
                        var folderPath = await _folderManagementService.BuildFolderPath(report.FolderId, report.OwnerType == OwnerType.Personal);
                        var files = _folderManagementService.GetFilesInFolder(folderPath, null, null);
                        var fileToDelete = files.FirstOrDefault(f => f.Name.Equals($"{report.ReportName}.{report.Format.ToString().ToLower()}", StringComparison.OrdinalIgnoreCase));

                        if (fileToDelete != null)
                        {
                            File.Delete(fileToDelete.FilePath);
                            _logger.LogInformation("Deleted report file: {filePath}", fileToDelete.FilePath);
                        }
                        else
                        {
                            _logger.LogWarning("Report file not found: {filePath}", Path.Combine(folderPath, $"{report.ReportName}.{report.Format.ToString().ToLower()}"));
                        }
                    }
                }

                _logger.LogInformation("Retention scan completed at: {time}", DateTimeOffset.Now);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Retention cleanup operation was canceled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during retention cleanup");
            }
        }
    }

    public class ReportRequest
    {
        public string reportId { get; set; }
        public string reportName { get; set; }
        public string connectionId { get; set; }
        public string reportType { get; set; }
        public string folderPath { get; set; }
        public string semicolonSeparatedEmails { get; set; }
        public BuildSQLRequest buildSqlRequest { get; set; }
    }
}
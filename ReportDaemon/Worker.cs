using MongoDB.Driver.Core.Connections;
using ReportManager.Services;
using static ReportManager.API.ReportController;
using System.Timers;
using System.Collections.Concurrent;
using MongoDB.Bson;
using ReportManager.Models;
using MongoDB.Driver;

namespace ReportDaemon
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        private readonly ConnectionService _connectionService;
        private readonly ReportManagementService _reportManagementService;
        private readonly SharedService _sharedService;
        private readonly EmailService _emailService;
        private readonly DatabaseService _databaseService;
        private readonly FolderManagementService _folderManagementService;
        private ConcurrentQueue<ReportRequest> _reportQueue;

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

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);
                await ProcessReportQueueAsync(stoppingToken);
                await Task.Delay(1000, stoppingToken);
            }
        }
        // TODO: Retry on certain error codes, network connectivity etc.

        public void EnqueueReportRequest(ReportRequest request)
        {
            _reportQueue.Enqueue(request);
            _logger.LogInformation("Enqueued report request: {reportId}", request.reportId);
        }

        private async Task ProcessReportQueueAsync(CancellationToken stoppingToken)
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
                    var filePath = Path.Combine(folderPath, fileName);
                    await File.WriteAllBytesAsync(filePath, fileBytes);
                    _logger.LogInformation("Saved report file: {filePath}", filePath);

                    var emailRecipients = request.commaSeparatedEmails.Split(',').Select(email => email.Trim()).ToList();
                    var emailSubject = $"Report: {request.reportName}";
                    var emailBody = $"Please find the attached report file: {fileName}";

                    using (var memoryStream = new MemoryStream(fileBytes))
                    {
                        var emailAttachment = new EmailAttachment
                        {
                            Content = memoryStream,
                            ContentType = contentType,
                            FileName = fileName
                        };

                        await _emailService.SendEmailAsync(emailRecipients, emailSubject, emailBody, emailAttachment);
                    }

                    _logger.LogInformation("Sent email notifications for report: {reportId}", request.reportId);

                    _logger.LogInformation("Completed processing report request: {reportId}", request.reportId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing report request: {reportId}", request.reportId);
                }
            }
        }

        public async Task ProcessScheduledReportsAsync(CancellationToken cancellationToken)
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
                commaSeparatedEmails = string.Join(",", report.EmailRecipients),
                buildSqlRequest = buildSqlRequest
            };

            return reportRequest;
        }
    }

    public class ReportRequest
    {
        public string reportId { get; set; }
        public string reportName { get; set; }
        public string connectionId { get; set; }
        public string reportType { get; set; }
        public string folderPath {  get; set; }
        public string commaSeparatedEmails { get; set; }
        public BuildSQLRequest buildSqlRequest { get; set; }
    }
}

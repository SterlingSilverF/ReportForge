using ClosedXML.Excel;
using DocumentFormat.OpenXml.Spreadsheet;
using MongoDB.Bson;
using MongoDB.Driver;
using ReportManager.Models;
using System.Drawing;
using System.Text;
using System.Xml.Linq;
using static ReportManager.API.ReportController;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using Table = iText.Layout.Element.Table;
using Cell = iText.Layout.Element.Cell;

namespace ReportManager.Services
{
    public enum ReportType
    {
        Personal,
        Group
    }

    public class ReportManagementService
    {
        private readonly IMongoCollection<ReportConfigurationModel> _reports;
        private readonly IMongoCollection<ReportConfigurationModel> _personalreports;

        public ReportManagementService(AppDatabaseService databaseService)
        {
            _reports = databaseService.GetCollection<ReportConfigurationModel>("GroupReports");
            _personalreports = databaseService.GetCollection<ReportConfigurationModel>("PersonalReports");
        }

        private IMongoCollection<ReportConfigurationModel> GetReportCollection(ReportType type)
        {
            return type == ReportType.Group ? _reports : _personalreports;
        }

        public static ReportType ParseReportType(string reportTypeStr)
        {
            return Enum.TryParse(reportTypeStr, true, out ReportType reportType)
                ? reportType
                : throw new ArgumentException("Invalid report type", nameof(reportTypeStr));
        }

        public List<ReportConfigurationModel> GetAllReports(string type)
        {
            var reportType = ParseReportType(type);
            return GetReportCollection(reportType).Find(report => true).ToList();
        }

        public bool CreateReport(ReportConfigurationModel newReport, string type)
        {
            var reportType = ParseReportType(type);
            GetReportCollection(reportType).InsertOne(newReport);
            return true;
        }

        public List<ReportConfigurationModel> GetReportsByFolder(ObjectId folderId, bool type)
        {
            ReportType reportType;
            if (type)
            {
                reportType = ReportType.Personal;
            }
            else
            {
                reportType = ReportType.Group;
            }

            var filter = Builders<ReportConfigurationModel>.Filter.Eq(r => r.FolderId, folderId);
            return GetReportCollection(reportType).Find(filter).ToList();
        }

        public List<ReportConfigurationModel> GetReportsByGroup(ObjectId groupId)
        {
            var filter = Builders<ReportConfigurationModel>.Filter.And(
                Builders<ReportConfigurationModel>.Filter.Eq(r => r.OwnerType, OwnerType.Group),
                Builders<ReportConfigurationModel>.Filter.Eq(r => r.OwnerID, groupId));

            return _reports.Find(filter).ToList();
        }

        public ReportConfigurationModel GetReportById(ObjectId reportId, string type)
        {
            var reportType = ParseReportType(type);
            var filter = Builders<ReportConfigurationModel>.Filter.Eq(r => r.Id, reportId);
            return GetReportCollection(reportType).Find(filter).FirstOrDefault();
        }

        public List<ReportConfigurationModel> GetPersonalReportsByCreatorId(ObjectId userId)
        {
            var filter = Builders<ReportConfigurationModel>.Filter.Eq("CreatorId", userId);
            return _personalreports.Find(filter).ToList();
        }

        public List<ReportConfigurationModel> GetReportsByOwnerId(ObjectId ownerId, string type)
        {
            var reportType = ParseReportType(type);
            var filter = Builders<ReportConfigurationModel>.Filter.Eq("OwnerId", ownerId);
            var reportCollection = GetReportCollection(reportType);
            return reportCollection.Find(filter).ToList();
        }

        public bool UpdateReport(ReportConfigurationModel updatedReport, string type)
        {
            var reportType = ParseReportType(type);
            var filter = Builders<ReportConfigurationModel>.Filter.Eq(r => r.Id, updatedReport.Id);
            var result = GetReportCollection(reportType).ReplaceOne(filter, updatedReport);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public bool DeleteReport(ObjectId reportId, string type)
        {
            var reportType = ParseReportType(type);
            var filter = Builders<ReportConfigurationModel>.Filter.Eq(r => r.Id, reportId);
            var result = GetReportCollection(reportType).DeleteOne(filter);
            return result.IsAcknowledged && result.DeletedCount > 0;
        }

        public byte[] GenerateCsv(List<Dictionary<string, object>> data)
        {
            var stringBuilder = new StringBuilder();

            if (data.Any())
            {
                stringBuilder.AppendLine(string.Join(",", data.First().Keys));
                foreach (var row in data)
                {
                    stringBuilder.AppendLine(string.Join(",", row.Values.Select(value => $"\"{value}\"")));
                }
            }
            return Encoding.UTF8.GetBytes(stringBuilder.ToString());
        }

        public byte[] GenerateXlsx(List<Dictionary<string, object>> data, string reportName)
        {
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add(reportName);
                var headers = data.FirstOrDefault()?.Keys;
                if (headers != null)
                {
                    int columnIndex = 1;
                    foreach (var header in headers)
                    {
                        worksheet.Cell(1, columnIndex++).Value = header;
                    }

                    int rowIndex = 2;
                    foreach (var row in data)
                    {
                        columnIndex = 1;
                        foreach (var value in row.Values)
                        {
                            worksheet.Cell(rowIndex, columnIndex++).Value = value?.ToString() ?? string.Empty;
                        }
                        rowIndex++;
                    }
                }

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    return stream.ToArray();
                }
            }
        }

        public byte[] GeneratePdf(List<Dictionary<string, object>> data, string reportName)
        {
            try
            {
                using (var memoryStream = new MemoryStream())
                {
                    var writer = new PdfWriter(memoryStream);
                    var pdf = new PdfDocument(writer);
                    var document = new Document(pdf);

                    var title = new Paragraph(reportName)
                        .SetTextAlignment(TextAlignment.CENTER)
                    .SetFontSize(14);

                    document.Add(title);

                    if (data.Count > 0)
                    {
                        var table = new Table(data[0].Count);
                        table.SetWidth(UnitValue.CreatePercentValue(100));
                        foreach (var key in data[0].Keys)
                        {
                            table.AddHeaderCell(new Cell().Add(new Paragraph(key)));
                        }

                        foreach (var row in data)
                        {
                            foreach (var cell in row.Values)
                            {
                                table.AddCell(new Cell().Add(new Paragraph(cell.ToString())));
                            }
                        }

                        document.Add(table);
                    }

                    document.Close();
                    return memoryStream.ToArray();
                }
            }
            catch (Exception ex)
            {
                // TODO: logging
                return null;
            }
        }

        public byte[] GenerateTxtPipeDelimited(List<Dictionary<string, object>> data)
        {
            var stringBuilder = new StringBuilder();
            if (data.Any())
            {
                stringBuilder.AppendLine(string.Join("|", data.First().Keys));
            }

            foreach (var row in data)
            {
                stringBuilder.AppendLine(string.Join("|", row.Values.Select(value => value?.ToString() ?? "")));
            }
            return Encoding.UTF8.GetBytes(stringBuilder.ToString());
        }

        public string BuildSQLQuery(BuildSQLRequest raw)
        {
            string sql = "SELECT ";
            sql += BuildSelectClause(raw.SelectedColumns);
            sql += " FROM ";
            sql += BuildFromClause(raw.SelectedTables, raw.JoinConfig);
            sql += BuildWhereClause(raw.Filters);
            sql += BuildOrderByClause(raw.OrderBys);
            return sql;
        }

        private string BuildSelectClause(List<BaseColumnDefinition> selectedColumns)
        {
            string selectClause = "";
            foreach (var column in selectedColumns)
            {
                selectClause += $"{column.Table}.{column.ColumnName}, ";
            }
            selectClause = selectClause.TrimEnd(' ', ',');
            return selectClause;
        }

        private string BuildFromClause(List<string> selectedTables, List<JoinConfigItem> joinConfig)
        {
            StringBuilder fromClauseBuilder = new StringBuilder();

            if (selectedTables.Count > 0)
            {
                fromClauseBuilder.Append(selectedTables[0]);
            }

            for (int i = 1; i < selectedTables.Count; i++)
            {
                var join = joinConfig.FirstOrDefault(j =>
                    (selectedTables[i - 1] == j.TableOne && selectedTables[i] == j.TableTwo) ||
                    (selectedTables[i - 1] == j.TableTwo && selectedTables[i] == j.TableOne));

                if (join != null && join.IsValid)
                {
                    string joinTableOne = join.TableOne;
                    string joinTableTwo = join.TableTwo;
                    string joinColumnOne = join.ColumnOne;
                    string joinColumnTwo = join.ColumnTwo;

                    if (selectedTables[i - 1] == join.TableTwo && selectedTables[i] == join.TableOne)
                    {
                        // Swap tables and columns
                        joinTableOne = join.TableTwo;
                        joinTableTwo = join.TableOne;
                        joinColumnOne = join.ColumnTwo;
                        joinColumnTwo = join.ColumnOne;
                    }

                    fromClauseBuilder.Append($" INNER JOIN {joinTableTwo} ON {joinTableOne}.{joinColumnOne} = {joinTableTwo}.{joinColumnTwo}");
                }
                else
                {
                    throw new Exception("Join conditions missing or invalid!");
                }
            }

            return fromClauseBuilder.ToString();
        }

        private string BuildWhereClause(List<FilterItem> filters)
        {
            if (filters.Count == 0)
            {
                return "";
            }

            string whereClause = " WHERE ";
            bool isFirstFilter = true;

            foreach (var filter in filters)
            {
                if (!isFirstFilter)
                {
                    whereClause += $" {filter.AndOr} ";
                }
                else
                {
                    isFirstFilter = false;
                }

                whereClause += $"{filter.Table}.{filter.Column} {filter.Condition} '{filter.Value}'";
            }

            return whereClause;
        }

        private string BuildOrderByClause(List<OrderByItem> orderBys)
        {
            if (orderBys.Count == 0)
            {
                return "";
            }
            string orderByClause = " ORDER BY ";
            foreach (var orderBy in orderBys)
            {
                orderByClause += $"{orderBy.Table}.{orderBy.Column} {orderBy.Direction}, ";
            }
            orderByClause = orderByClause.TrimEnd(' ', ',');
            return orderByClause;
        }

        public ReportConfigurationModel TransformRequestToModel(ReportFormContext request, SharedService _sharedService, bool existing)
        {
            try
            {
                var userIdObjectId = _sharedService.StringToObjectId(request.UserId);
                var connectionStringId = _sharedService.StringToObjectId(request.SelectedConnection);
                var folderId = _sharedService.StringToObjectId(request.SelectedFolder);
                var ownerId = request.ReportType.Equals("Personal", StringComparison.OrdinalIgnoreCase)
                    ? userIdObjectId
                    : _sharedService.StringToObjectId(request.SelectedGroup);

                var schedules = new List<ScheduleInfo>
                {
                    new ScheduleInfo
                    {
                        ScheduleType = ConvertToScheduleType(request.ReportFrequencyType),
                        Iteration = request.ReportFrequencyValue,
                        ExecuteTime = TimeOnly.Parse(request.ReportGenerationTime)
                    }
                };

                var selectedColumns = request.SelectedColumns
                    .Select(columnDto => new ColumnDefinition
                    {
                        Table = columnDto.Table,
                        ColumnName = columnDto.ColumnName,
                        DataType = columnDto.DataType,
                        DisplayOrder = columnDto.DisplayOrder,
                        ColumnFormatting = columnDto.ColumnFormatting != null
                            ? new ColumnFormatting
                            {
                                Conversion = Enum.Parse<ConversionType>(columnDto.ColumnFormatting.Conversion),
                                FormatValue = columnDto.ColumnFormatting.FormatValue,
                                MaxLength = columnDto.ColumnFormatting.MaxLength
                            }
                            : null
                    })
                    .ToList();

                var joinConfigItems = request.JoinConfig
                    .Select(joinItem => new JoinConfigItem
                    {
                        TableOne = joinItem.TableOne,
                        TableTwo = joinItem.TableTwo,
                        ColumnOne = joinItem.ColumnOne,
                        ColumnTwo = joinItem.ColumnTwo,
                        IsValid = joinItem.IsValid
                    })
                    .ToList();

                var filterItems = request.Filters
                    .Select(filterItem => new FilterItem
                    {
                        Id = filterItem.Id,
                        Table = filterItem.Table,
                        Column = filterItem.Column,
                        Condition = filterItem.Condition,
                        Value = filterItem.Value,
                        AndOr = filterItem.AndOr
                    })
                    .ToList();

                var orderByItems = request.OrderBys
                    .Select(orderByItem => new OrderByItem
                    {
                        Id = orderByItem.Id,
                        Table = orderByItem.Table,
                        Column = orderByItem.Column,
                        Direction = orderByItem.Direction
                    })
                    .ToList();

                var model = new ReportConfigurationModel
                {
                    ReportName = request.ReportName,
                    Description = request.ReportDescription,
                    ConnectionStringId = connectionStringId,
                    Schedules = schedules,
                    FolderId = folderId,
                    CreatorId = userIdObjectId,
                    LastModifiedBy = userIdObjectId,
                    OwnerID = ownerId,
                    LastModifiedDate = DateTime.UtcNow,
                    OwnerType = request.ReportType.Equals("Personal", StringComparison.OrdinalIgnoreCase)
                        ? OwnerType.User
                        : OwnerType.Group,
                    CompiledSQL = request.CompiledSQL,
                    SelectedColumns = selectedColumns,
                    EmailRecipients = request.EmailReports.Equals("yes", StringComparison.OrdinalIgnoreCase)
                        ? request.EmailRecipients.Split(';').ToList()
                        : new List<string>(),
                    Format = Enum.Parse<ReportFormat>(request.OutputFormat),
                    JoinConfig = joinConfigItems,
                    Filters = filterItems,
                    OrderBys = orderByItems
                };

                if (!existing)
                {
                    model.CreatedDate = DateTime.UtcNow;
                }

                return model;
            }
            catch (Exception ex)
            {
                // TODO: logging
                throw new Exception("An error occurred while transforming the request to model.", ex);
            }
        }

        public ReportFormContext TransformModelToRequest(ReportConfigurationModel model)
        {
            try
            {
                var selectedColumns = model.SelectedColumns
                    .Select(column => new ColumnDefinitionDTO
                    {
                        Table = column.Table,
                        ColumnName = column.ColumnName,
                        DataType = column.DataType,
                        DisplayOrder = column.DisplayOrder,
                        ColumnFormatting = column.ColumnFormatting != null
                            ? new ColumnFormattingDTO
                            {
                                Conversion = column.ColumnFormatting.Conversion.ToString(),
                                FormatValue = column.ColumnFormatting.FormatValue,
                                MaxLength = column.ColumnFormatting.MaxLength
                            }
                            : null
                    })
                    .ToList();

                var filters = model.Filters?
                    .Select(filter => new FilterItem
                    {
                        Id = filter.Id,
                        Table = filter.Table,
                        Column = filter.Column,
                        Condition = filter.Condition,
                        Value = filter.Value,
                        AndOr = filter.AndOr
                    })
                    .ToList();

                var orderBys = model.OrderBys?
                    .Select(orderBy => new OrderByItem
                    {
                        Id = orderBy.Id,
                        Table = orderBy.Table,
                        Column = orderBy.Column,
                        Direction = orderBy.Direction
                    })
                    .ToList();

                var joinConfig = model.JoinConfig?
                    .Select(joinItem => new JoinConfigItem
                    {
                        TableOne = joinItem.TableOne,
                        TableTwo = joinItem.TableTwo,
                        ColumnOne = joinItem.ColumnOne,
                        ColumnTwo = joinItem.ColumnTwo,
                        IsValid = joinItem.IsValid
                    })
                    .ToList();

                var request = new ReportFormContext
                {
                    ReportName = model.ReportName,
                    ReportDescription = model.Description,
                    SelectedConnection = model.ConnectionStringId.ToString(),
                    SelectedFolder = model.FolderId.ToString(),
                    UserId = model.CreatorId.ToString(),
                    SelectedGroup = model.OwnerType == OwnerType.Group ? model.OwnerID.ToString() : null,
                    ReportType = model.OwnerType == OwnerType.User ? "Personal" : "Group",
                    CompiledSQL = model.CompiledSQL,
                    OutputFormat = model.Format.ToString(),
                    ReportGenerationTime = model.Schedules.FirstOrDefault()?.ExecuteTime.ToString(),
                    ReportFrequencyValue = model.Schedules.FirstOrDefault()?.Iteration ?? 0,
                    ReportFrequencyType = model.Schedules.FirstOrDefault()?.ScheduleType.ToString(),
                    EmailReports = model.EmailRecipients != null && model.EmailRecipients.Any() ? "yes" : "no",
                    EmailRecipients = model.EmailRecipients != null ? string.Join(";", model.EmailRecipients) : null,
                    SelectedColumns = selectedColumns,
                    Filters = filters,
                    OrderBys = orderBys,
                    JoinConfig = joinConfig
                };

                return request;
            }
            catch (Exception ex)
            {
                // TODO: logging
                throw new Exception("An error occurred while transforming the model to request.", ex);
            }
        }

        private ScheduleType ConvertToScheduleType(string frequencyType)
        {
            return frequencyType.ToLower() switch
            {
                "days" => ScheduleType.Daily,
                "weeks" => ScheduleType.Weekly,
                "months" => ScheduleType.Monthly,
                "quarters" => ScheduleType.Quarterly,
                "years" => ScheduleType.Yearly,
                _ => throw new ArgumentException("Invalid frequency type"),
            };
        }

        public static string QuoteIdentifier(string identifier, string dbType)
        {
            switch (dbType.ToLower())
            {
                case "mssql":
                case "db2":
                    return $"[{identifier}]";
                case "oracle":
                case "mysql":
                case "postgres":
                    return $"\"{identifier}\"";
                default:
                    return identifier;
            }
        }

        public static string FormatStringLiteral(string value, string dbType)
        {
            switch (dbType.ToLower())
            {
                case "mssql":
                case "postgres":
                    return $"\'{value.Replace("'", "''") ?? "NULL"}\'";
                case "oracle":
                    return $"\'{value.Replace("'", "''") ?? "NULL"}\'";
                case "mysql":
                    return $"\'{value.Replace("'", "''") ?? "NULL"}\'";
                case "db2":
                    return $"\'{value.Replace("'", "''") ?? "NULL"}\'";
                default:
                    return $"'{value}'";
            }
        }

        public static string FormatBoolean(bool value, string dbType)
        {
            switch (dbType.ToLower())
            {
                case "mssql":
                    return value ? "1" : "0";
                case "oracle":
                    return value ? "1" : "0";
                case "mysql":
                    return value ? "TRUE" : "FALSE";
                case "postgres":
                    return value ? "TRUE" : "FALSE";
                case "db2":
                    return value ? "1" : "0";
                default:
                    return value ? "1" : "0";
            }
        }

        public static string ConcatenateStrings(string str1, string str2, string dbType)
        {
            switch (dbType.ToLower())
            {
                case "mssql":
                    return $"{str1} + {str2}";
                case "oracle":
                    return $"{str1} || {str2}";
                case "mysql":
                case "postgres":
                case "db2":
                    return $"{str1} || {str2}";
                default:
                    return $"{str1} + {str2}";
            }
        }
    }
}
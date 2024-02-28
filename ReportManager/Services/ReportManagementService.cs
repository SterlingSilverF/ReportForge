using ClosedXML.Excel;
using MongoDB.Bson;
using MongoDB.Driver;
using Org.BouncyCastle.Asn1.Ocsp;
using PdfSharp.Drawing;
using PdfSharp.Pdf;
using ReportManager.Models;
using System.Drawing;
using System.Text;
using System.Xml.Linq;
using static ReportManager.API.ReportController;
using static ReportManager.Models.SQL_Builder;

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

        public List<ReportConfigurationModel> GetAllReports(ReportType type)
        {
            return GetReportCollection(type).Find(report => true).ToList();
        }

        public bool CreateReport(ReportConfigurationModel newReport, ReportType type)
        {
            GetReportCollection(type).InsertOne(newReport);
            return true;
        }

        public List<ReportConfigurationModel> GetReportsByFolder(ObjectId folderId, ReportType type)
        {
            var filter = Builders<ReportConfigurationModel>.Filter.Eq(r => r.FolderId, folderId);
            return GetReportCollection(type).Find(filter).ToList();
        }

        public ReportConfigurationModel GetReportById(ObjectId reportId, ReportType type)
        {
            var filter = Builders<ReportConfigurationModel>.Filter.Eq(r => r.Id, reportId);
            return GetReportCollection(type).Find(filter).FirstOrDefault();
        }

        public List<ReportConfigurationModel> GetPersonalReportsByCreatorId(ObjectId userId)
        {
            var filter = Builders<ReportConfigurationModel>.Filter.Eq("CreatorId", userId);
            return _personalreports.Find(filter).ToList();
        }

        public List<ReportConfigurationModel> GetReportsByOwnerId(ObjectId ownerId, ReportType reportType)
        {
            var filter = Builders<ReportConfigurationModel>.Filter.Eq("OwnerId", ownerId);
            var reportCollection = GetReportCollection(reportType);
            return reportCollection.Find(filter).ToList();
        }

        public bool UpdateReport(ReportConfigurationModel updatedReport, ReportType type)
        {
            var filter = Builders<ReportConfigurationModel>.Filter.Eq(r => r.Id, updatedReport.Id);
            var result = GetReportCollection(type).ReplaceOne(filter, updatedReport);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public bool DeleteReport(ObjectId reportId, ReportType type)
        {
            var filter = Builders<ReportConfigurationModel>.Filter.Eq(r => r.Id, reportId);
            var result = GetReportCollection(type).DeleteOne(filter);
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
            var document = new PdfDocument();
            var page = document.AddPage();
            var graphics = XGraphics.FromPdfPage(page);
            var titleFont = new XFont("Verdana", 14.0, XFontStyleEx.Bold);
            var contentFont = new XFont("Verdana", 10.0, XFontStyleEx.Regular);

            float yPoint = 20;
            graphics.DrawString(reportName, titleFont, XBrushes.Black, new XRect(0, 0, page.Width, page.Height), XStringFormats.TopCenter);
            yPoint += 40;

            foreach (var row in data)
            {
                string line = string.Join(", ", row.Select(kv => $"{kv.Key}: {kv.Value}"));
                graphics.DrawString(line, contentFont, XBrushes.Black, new XRect(0, yPoint, page.Width, page.Height), XStringFormats.TopLeft);
                yPoint += 20;
            }

            using (var stream = new MemoryStream())
            {
                document.Save(stream, false);
                return stream.ToArray();
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

        private string BuildSelectClause(List<ColumnDefinition> selectedColumns)
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
            string fromClause = "";
            if (selectedTables.Count > 0)
            {
                fromClause += selectedTables[0];
            }

            for (int i = 1; i < selectedTables.Count; i++)
            {
                var join = joinConfig.FirstOrDefault(j => j.TableOne == selectedTables[i - 1] || j.TableTwo == selectedTables[i]);
                if (join != null && join.IsValid)
                {
                    fromClause += $" INNER JOIN {selectedTables[i]} ON {join.TableOne}.{join.ColumnOne} = {join.TableTwo}.{join.ColumnTwo}";
                }
                else
                {
                    // TODO: logging
                    throw new Exception("Join conditions missing!");
                }
            }

            return fromClause;
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
            string orderByClause = " ORDER BY ";
            foreach (var orderBy in orderBys)
            {
                orderByClause += $"{orderBy.Table}.{orderBy.Column} {orderBy.Direction}, ";
            }
            orderByClause = orderByClause.TrimEnd(' ', ',');
            return orderByClause;
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
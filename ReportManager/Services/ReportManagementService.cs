using MongoDB.Bson;
using MongoDB.Driver;
using ReportManager.Models;
using static ReportManager.API.ReportController;

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

        // SQL
        /*public string GenerateSelectSQL(selectedColumns)
        {
            string sql = "SELECT ";
            foreach (string table in request.SelectedTables)
            {
                foreach (string column in request.SelectedColumns)
                {
                    sql += $"{GetColumnName(table, column)}, ";
                }
            }
            sql = sql.TrimEnd(',', ' ') + " FROM ...";

            return sql;
        }

        private string GetColumnName(string table, string column)
        {
            return $"{table}.{column}";
        }*/
    }
}
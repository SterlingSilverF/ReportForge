using MongoDB.Bson;
using ReportManager.Models;

namespace ReportManager.Models
{
    public class ReportConfigurationModel
    {
        public ObjectId Id { get; set; }
        public string ReportName { get; set; }
        public string? Description { get; set; }
        public DBConnectionModel SourceDB { get; set; }
        public ScheduleInfo Schedule { get; set; }
        public List<Job>? ReportJobs { get; set; }
        public int PaginationLimit { get; set; }
        public ObjectId FolderId { get; set; }
        public ObjectId CreatorId { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastModifiedDate { get; set; }
        public ObjectId LastModifiedBy { get; set; }
        public ObjectId OwnerID { get; set; }
        public OwnerType OwnerType { get; set; }
    }

    public class CustomSQLReport : ReportConfigurationModel
    {
        public string CustomSQL { get; set; }
    }

    public class NormalReportConfiguration : ReportConfigurationModel
    {
        public HashSet<DatabaseObjectInfoModel> SelectedObjects { get; set; }
        public List<ReportColumn> Columns { get; set; }
        public List<Filter>? Filters { get; set; }
        public List<string> OrderBy { get; set; }
    }

    public class ReportColumn
    {
        public DatabaseObjectInfoModel ParentObject { get; set; }
        public string ColumnName { get; set; }
        public int DisplayOrder { get; set; }
        public ColumnFormatting? ColumnFormatting { get; set; }
    }

    public class ColumnFormatting
    {
        public ConversionType Conversion { get; set; }
        public string? FormatValue { get; set; } // This can be patterns for dates, etc.
        public int? MaxLength { get; set; }
    }

    public enum ConversionType
    {
        None,            // No specific conversion
        DateToFormat,    // Convert a date into a specific format
        StringToInt,     // Convert a string representation of an int to an actual int
        StringToMoney   // Convert a string representation of money to specific money formats
    }

    public class Filter
    {
        public OperationType Operation { get; set; }
        public string ColumnName { get; set; }
        public List<string> Values { get; set; } = new List<string>();
    }

    public enum OperationType
    {
        Equals,
        NotEquals,
        GreaterThan,
        GreaterThanOrEqualTo,
        LessThan,
        LessThanOrEqualTo,
        Between,
        In
    }

    public class ScheduleInfo
    {
        public ScheduleType ScheduleType { get; set; }
        public int Iteration { get; set; } // every x [days, weeks]
        public TimeOnly ExecuteTime { get; set; }
    }

    public enum ScheduleType
    {
        Daily,
        Weekly,
        Monthly,
        Quarterly,
        Yearly
    }

    public class Job
    {
        public ScheduleInfo ScheduleInfo { get; set; }
        public ReportFormat ReportFormat { get; set; }
    }

    public enum ReportFormat
    {
        CSV,
        XLS,
        XLSX,
        PDF,
        TXT,
        JSON
    }

    public class EmailJob: Job
    {
        public List<string> Recipients { get; set; }
    }

    public class FileTransferJob: Job
    {
        public string Destination { get; set; }
    }
}

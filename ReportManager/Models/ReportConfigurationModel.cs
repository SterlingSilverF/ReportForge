using MongoDB.Bson;
using ReportManager.Models;
using static ReportManager.Models.SQL_Builder;

namespace ReportManager.Models
{
    public class ReportConfigurationModel
    {
        public ObjectId Id { get; set; }
        public string ReportName { get; set; }
        public string? Description { get; set; }
        public ObjectId ConnectionStringId { get; set; }
        public List<ScheduleInfo> Schedules { get; set; }
        public ObjectId FolderId { get; set; }
        public ObjectId CreatorId { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastModifiedDate { get; set; }
        public ObjectId LastModifiedBy { get; set; }
        public ObjectId OwnerID { get; set; }
        public OwnerType OwnerType { get; set; }
        public string CompiledSQL { get; set; }
        public List<ColumnDefinition> SelectedColumns { get; set; }
        public List<string> EmailRecipients { get; set; }
        public ReportFormat Format { get; set; }
    }

    public class ColumnDefinition : BaseColumnDefinition
    {
        public int? DisplayOrder { get; set; }
        public ColumnFormatting? ColumnFormatting { get; set; }
    }

    public class ColumnFormatting
    {
        public ConversionType Conversion { get; set; }
        public string? FormatValue { get; set; } // Patterns for dates, etc.
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

    public enum ReportFormat
    {
        csv,
        xlsx,
        pdf,
        txt,
        json
    }
}

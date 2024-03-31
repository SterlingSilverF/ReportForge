using MongoDB.Bson;
using ReportManager.Models;

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
        public List<JoinConfigItem> JoinConfig { get; set; }
        public List<FilterItem> Filters { get; set; }
        public List<OrderByItem> OrderBys { get; set; }
    }

    public class BaseColumnDefinition
    {
        public string Table { get; set; }
        public string ColumnName { get; set; }
        public string DataType { get; set; }
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

    public class JoinConfigItem
    {
        public string TableOne { get; set; }
        public string TableTwo { get; set; }
        public string ColumnOne { get; set; }
        public string ColumnTwo { get; set; }
        public bool IsValid { get; set; }
    }

    public class FilterItem
    {
        public string Id { get; set; }
        public string Table { get; set; }
        public string Column { get; set; }
        public string Condition { get; set; }
        public string Value { get; set; }
        public string? AndOr { get; set; }
    }

    public class OrderByItem
    {
        public string Id { get; set; }
        public string Table { get; set; }
        public string Column { get; set; }
        public string Direction { get; set; }
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

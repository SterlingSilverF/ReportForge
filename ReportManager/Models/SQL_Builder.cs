namespace ReportManager.Models
{
    public class SQL_Builder
    {
        public class ColumnDefinition
        {
            public string Table { get; set; }
            public string ColumnName { get; set; }
            public string DataType { get; set; }
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
            public List<string> ColumnOptions { get; set; } = new List<string>();
        }
    }
}

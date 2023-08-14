namespace ReportManager.Models
{
    public class DatabaseObjectInfo
    {
        public string ObjName { get; set; }
        public ObjectType ObjType { get; set; }
        public List<Column> ?Columns { get; set; }
    }

    public class Column
    {
        public string ColumnName { get; set; }
        public string DataType { get; set; }
        public KeyType KeyType { get; set; } // Enum representing the type of key
        public string ?ReferenceTable { get; set; } // Only used if KeyType is ForeignKey
        public string ?ReferenceColumn { get; set; } // Only used if KeyType is ForeignKey
    }

    public enum KeyType
    {
        None,
        PrimaryKey,
        ForeignKey,
        Key
    }

    public enum ObjectType
    {
        Table,
        View,
        Procedure
    }
}

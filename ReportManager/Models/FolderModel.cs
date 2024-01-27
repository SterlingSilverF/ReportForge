using MongoDB.Bson;

namespace ReportManager.Models
{
    public class FolderModel
    {
        public ObjectId Id { get; set; }
        public ObjectId? ParentId { get; set; }
        public string FolderName { get; set; }
        public string FolderPath { get; set; }
        public bool IsObjectFolder { get; set; } // Aka a group or user
    }

    public class PersonalFolder: FolderModel
    {
        public ObjectId Owner { get; set; } // FK user Id
    }
}

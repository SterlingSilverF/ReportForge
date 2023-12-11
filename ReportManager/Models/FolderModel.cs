using MongoDB.Bson;

namespace ReportManager.Models
{
    public class FolderModel
    {
        public ObjectId Id { get; set; }
        public ObjectId? ParentId { get; set; }
        public string FolderName { get; set; }
        public string FolderPath { get; set; }
        public bool IsGroupTopFolder { get; set; }
    }

    public class PersonalFolder: FolderModel
    {
        public ObjectId Owner { get; set; } // FK user Id
    }
}

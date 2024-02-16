using MongoDB.Bson;

namespace ReportManager.Models
{
    public class PermissionKeyModel
    {
        public ObjectId Id { get; set; }
        public string CreatedUsername { get; set; }
        public string Groupname { get; set; }
        public UserType UserType { get; set; }
        public long Timestamp { get; set; }
        public DateTime? Expiration { get; set; }
        public bool Used { get; set; }
    }
}
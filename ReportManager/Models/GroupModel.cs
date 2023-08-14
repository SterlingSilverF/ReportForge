using MongoDB.Bson;
using MongoDB.Driver.Core.Configuration;

namespace ReportManager.Models
{
    public class _Group
    {
        public ObjectId Id { get; set; }
        public string GroupName { get; set; }
        public List<ObjectId> GroupOwners { get; set; }
        public List<ObjectId> GroupMembers { get; set; }
        public List<ObjectId> Folders { get; set; }
        public List<ConnectionSettings> GroupConnectionStrings { get; set; }
        public bool IsAdminGroup { get; set; }
    }
}

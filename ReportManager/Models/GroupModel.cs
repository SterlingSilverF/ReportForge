using MongoDB.Bson;
using MongoDB.Driver.Core.Configuration;
using ReportManager.Models.SettingsModels;

namespace ReportManager.Models
{
    public class _Group
    {
        public ObjectId Id { get; set; }
        public string GroupName { get; set; }
        public HashSet<string> GroupOwners { get; set; }
        public HashSet<string> GroupMembers { get; set; }
        public HashSet<ObjectId> Folders { get; set; }
        public HashSet<ObjectId>? GroupConnectionStrings { get; set; } // FK ServerConnectionModel.Id
        public bool IsTopGroup { get; set; }
        public ObjectId? ParentId { get; set; } // _Group Id
    }
}
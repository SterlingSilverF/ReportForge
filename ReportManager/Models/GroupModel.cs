using MongoDB.Bson;
using MongoDB.Driver.Core.Configuration;
using ReportManager.Models.SettingsModels;

namespace ReportManager.Models
{
    public class _Group
    {
        public ObjectId Id { get; set; }
        public string GroupName { get; set; }
        public List<string> GroupOwners { get; set; }
        public List<string> GroupMembers { get; set; }
        public List<ObjectId> Folders { get; set; }
        public List<ObjectId>? GroupConnectionStrings { get; set; } // FK ServerConnectionModel.Id
        public bool IsTopGroup { get; set; }
    }
}
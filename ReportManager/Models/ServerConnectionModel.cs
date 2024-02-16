using MongoDB.Bson;

namespace ReportManager.Models
{
    public class ServerConnectionModel
    {
        public ObjectId Id { get; set; }
        public string ServerName { get; set; }
        public int Port { get; set; }
        public string? Instance { get; set; }
        public string DbType { get; set; }
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string AuthType { get; set; }
        public ObjectId OwnerID { get; set; }
        public OwnerType OwnerType { get; set; }

        // MongoDB
        public string? AuthSource { get; set; } = null;
        public string? ReplicaSet { get; set; } = null;
        public bool? UseTLS { get; set; } = null;
    }
}
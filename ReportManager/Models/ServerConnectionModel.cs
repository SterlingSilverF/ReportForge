namespace ReportManager.Models
{
    public class ServerConnectionModel
    {
        public string ServerId { get; set; }
        public string ?Server { get; set; }
        public int Port { get; set; }
        public string? Instance { get; set; }
        public string DbType { get; set; }
        public string ?Username { get; set; }
        public string ?Password { get; set; }
        public string AuthType { get; set; }
        public string ConnectionGroupName { get; set; }
    }
}
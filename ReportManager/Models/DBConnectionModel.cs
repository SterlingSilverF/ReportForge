namespace ReportManager.Models
{
    public class DBConnectionModel : ServerConnectionModel
    {
        public string? FriendlyName { get; set; }
        public string DatabaseName { get; set; }
        public string? Schema { get; set; }
    }
}
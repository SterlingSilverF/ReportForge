namespace ReportManager.Models
{
    public class DBConnectionModel : BaseConnectionModel
    {
        public string? FriendlyName { get; set; }
        public string DatabaseName { get; set; }
        public string? Schema { get; set; }
    }
}
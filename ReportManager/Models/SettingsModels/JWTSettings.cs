﻿namespace ReportManager.Models.SettingsModels
{
    public class JwtSettings
    {
        public string SecurityKey { get; set; }
        public string ValidIssuer { get; set; }
        public string ValidAudience { get; set; }
    }
}

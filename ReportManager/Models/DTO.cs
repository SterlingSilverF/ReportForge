﻿namespace ReportManager.Models
{
    public class FolderDTO
    {
        public string Id { get; set; }
        public string ParentId { get; set; }
        public string FolderName { get; set; }
        public string FolderPath { get; set; }
        public bool IsGroupFolder { get; set; }
        public string Owner { get; set; } // PersonalFolder : FolderModel

        public FolderDTO(FolderModel model)
        {
            this.Id = model.Id.ToString();
            this.ParentId = model.ParentId?.ToString();
            this.FolderName = model.FolderName;
            this.FolderPath = model.FolderPath;
            this.IsGroupFolder = model.IsGroupTopFolder;

            if (model is PersonalFolder personalFolder)
            {
                this.Owner = personalFolder.Owner.ToString();
            }
        }
    }

    public class GroupDTO 
    {
        public string Id { get; set; }
        public string GroupName { get; set; }
        public List<string> GroupOwners { get; set; }
        public List<string> GroupMembers { get; set; }
        public List<string> Folders { get; set; }
        public List<string>? GroupConnectionStrings { get; set; }
        public bool IsTopGroup { get; set; }

        public GroupDTO(_Group model)
        {
            this.Id = model.Id.ToString();
            this.GroupName = model.GroupName;
            this.GroupOwners = model.GroupOwners;
            this.GroupMembers = model.GroupMembers;
            this.Folders = model.Folders.Select(f => f.ToString()).ToList();
            this.GroupConnectionStrings = model.GroupConnectionStrings?.Select(c => c.ToString()).ToList();
            this.IsTopGroup = model.IsTopGroup;
        }
    }

    public class ServerConnectionDTO
    {
        public string Id { get; set; }
        public string ServerName { get; set; }
        public int Port { get; set; }
        public string? Instance { get; set; }
        public string DbType { get; set; }
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string AuthType { get; set; }
        public string? OwnerID { get; set; }
        public string OwnerType { get; set; }

        public ServerConnectionDTO(ServerConnectionModel model)
        {
            this.Id = model.Id.ToString();
            this.ServerName = model.ServerName;
            this.Port = model.Port;
            this.Instance = model.Instance;
            this.DbType = model.DbType;
            this.Username = model.Username;
            this.Password = model.Password;
            this.AuthType = model.AuthType;
            this.OwnerID = model.OwnerID.ToString();
            this.OwnerType = model.OwnerType.ToString();
        }
    }
}
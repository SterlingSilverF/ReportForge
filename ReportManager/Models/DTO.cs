namespace ReportManager.Models
{
    public class FolderDTO
    {
        public string Id { get; set; }
        public string ParentId { get; set; }
        public string FolderName { get; set; }
        public string FolderPath { get; set; }

        public FolderDTO(FolderModel model)
        {
            this.Id = model.Id.ToString();
            this.ParentId = model.ParentId?.ToString();
            this.FolderName = model.FolderName;
            this.FolderPath = model.FolderPath;
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

}

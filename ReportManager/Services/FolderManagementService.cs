using MongoDB.Bson;
using MongoDB.Driver;
using Org.BouncyCastle.Asn1.X509;
using ReportManager.Models;
using System.Collections.Generic;
using ReportManager.Models;

namespace ReportManager.Services
{
    public class FolderManagementService
    {
        private readonly IMongoCollection<FolderModel> _folders;
        private readonly IMongoCollection<PersonalFolder> _personalFolders;
        private readonly GroupManagementService _groupManagementService;

        public FolderManagementService(AppDatabaseService databaseService, GroupManagementService groupManagementService)
        {
            _folders = databaseService.GetCollection<FolderModel>("GroupFolders");
            _personalFolders = databaseService.GetCollection<PersonalFolder>("PersonalFolders");
            _groupManagementService = groupManagementService;
        }

        public List<FolderModel> GetFolders(ObjectId groupId)
        {
            var filter = Builders<FolderModel>.Filter.Eq(f => f.Id, groupId);
            return _folders.Find(filter).ToList();
        }

        public FolderModel GetFolderById(ObjectId folderId)
        {
            var filter = Builders<FolderModel>.Filter.Eq(f => f.Id, folderId);
            return _folders.Find(filter).FirstOrDefault();
        }

        public bool CreateFolder(FolderModel folder)
        {
            _folders.InsertOne(folder);
            return true;
        }

        public bool UpdateFolder(FolderModel updatedFolder)
        {
            var filter = Builders<FolderModel>.Filter.Eq(f => f.Id, updatedFolder.Id);
            var result = _folders.ReplaceOne(filter, updatedFolder);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public bool DeleteFolder(ObjectId folderId)
        {
            var filter = Builders<FolderModel>.Filter.Eq(f => f.Id, folderId);
            var result = _folders.DeleteOne(filter);
            return result.IsAcknowledged && result.DeletedCount > 0;
        }

        public List<PersonalFolder> GetPersonalFoldersByUser(ObjectId userId)
        {
            var filter = Builders<PersonalFolder>.Filter.Eq(f => f.Owner, userId);
            return _personalFolders.Find(filter).ToList();
        }

        public List<FolderModel> GetFoldersByGroup(ObjectId groupId)
        {
            _Group group = _groupManagementService.GetGroup(groupId);
            if (group != null)
            {
                var folderIds = group.Folders;
                var filter = Builders<FolderModel>.Filter.In(f => f.Id, folderIds);
                return _folders.Find(filter).ToList();
            }
            return new List<FolderModel>();
        }

        public List<FolderModel> GetSubFoldersByParentId(ObjectId parentId)
        {
            FolderModel parentFolder = _folders.Find(f => f.Id == parentId).FirstOrDefault();
            if (parentFolder != null)
            {
                List<FolderModel> folderModels = _folders.Find(_ => true).ToList();
                var filter = Builders<FolderModel>.Filter.Eq("ParentId", parentId);
                return _folders.Find(filter).ToList();
            }
            return new List<FolderModel>();
        }
    }
}
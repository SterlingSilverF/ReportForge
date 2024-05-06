using MongoDB.Bson;
using MongoDB.Driver;
using ReportManager.Models;
using System.Collections.Generic;
using System.Configuration;
using System.Net;

namespace ReportManager.Services
{
    public class FolderManagementService
    {
        private readonly IMongoCollection<FolderModel> _folders;
        private readonly IMongoCollection<PersonalFolder> _personalFolders;
        private readonly GroupManagementService _groupManagementService;
        private readonly IConfiguration _configuration;
        private readonly string basePath;

        public FolderManagementService(AppDatabaseService databaseService, GroupManagementService groupManagementService, IConfiguration configuration)
        {
            _folders = databaseService.GetCollection<FolderModel>("GroupFolders");
            _personalFolders = databaseService.GetCollection<PersonalFolder>("PersonalFolders");
            _groupManagementService = groupManagementService;
            _configuration = configuration;
            var basePathValue = _configuration.GetValue<string>("BasePath");
            basePath = (basePathValue == null) ? "C:/ReportForge/" : basePathValue;
        }

        public List<FolderModel> GetFolders(ObjectId groupId)
        {
            var filter = Builders<FolderModel>.Filter.Eq(f => f.Id, groupId);
            return _folders.Find(filter).ToList();
        }

        public async Task<FolderModel> GetFolderById(ObjectId folderId, bool isPersonal)
        {
            if (isPersonal)
            {
                var personalFilter = Builders<PersonalFolder>.Filter.Eq(f => f.Id, folderId);
                PersonalFolder personalFolder = await _personalFolders.Find(personalFilter).FirstOrDefaultAsync();
                return personalFolder as FolderModel;
            }
            else
            {
                var filter = Builders<FolderModel>.Filter.Eq(f => f.Id, folderId);
                return await _folders.Find(filter).FirstOrDefaultAsync();
            }
        }

        public PersonalFolder GetUserFolder(string username)
        {
            var filter = Builders<PersonalFolder>.Filter.Eq(f => f.FolderName, username);
            return _personalFolders.Find(filter).FirstOrDefault();
        }

        public bool CreateDBFolder(FolderModel folder)
        {
            try
            {
                _folders.InsertOne(folder);
                return CreatePhysicalFolder(folder.FolderPath);
            }
            catch (Exception ex)
            {
                // TODO: Logging
                return false;
            }
        }

        public bool CreateDBPersonalFolder(PersonalFolder folder)
        {
            try
            {
                _personalFolders.InsertOne(folder);
                return CreatePhysicalFolder(folder.FolderPath);
            }
            catch (Exception ex)
            {
                // TODO: Logging
                return false;
            }
        }

        public async Task<bool> UpdateDBFolder(FolderModel updatedFolder)
        {
            bool folderType = updatedFolder is PersonalFolder ? true : false;
            var existingFolder = await GetFolderById(updatedFolder.Id, folderType);

            if (existingFolder == null) return false;

            var result = folderType == true
                ? await _personalFolders.ReplaceOneAsync(filter => filter.Id == updatedFolder.Id, updatedFolder as PersonalFolder)
                : await _folders.ReplaceOneAsync(filter => filter.Id == updatedFolder.Id, updatedFolder);

            if (existingFolder.FolderName != updatedFolder.FolderName)
            {
                if (!RenamePhysicalFolder(existingFolder.FolderPath, updatedFolder.FolderName))
                    return false;
            }
            else if (existingFolder.FolderPath != updatedFolder.FolderPath)
            {
                string newParentPath = Path.GetDirectoryName(updatedFolder.FolderPath);
                if (!MovePhysicalFolder(existingFolder.FolderPath, newParentPath))
                    return false;
            }

            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteDBFolder(ObjectId folderId, bool type)
        {
            var folder = await GetFolderById(folderId, type);
            if (folder == null) return false;

            if (type)
            {
                var result = await _personalFolders.DeleteOneAsync(filter => filter.Id == folderId);

                if (result.IsAcknowledged && result.DeletedCount > 0)
                {
                    return DeletePhysicalFolder(folder.FolderPath);
                }
            }
            else
            {
                var result = await _folders.DeleteOneAsync(filter => filter.Id == folderId);

                if (result.IsAcknowledged && result.DeletedCount > 0)
                {
                    return DeletePhysicalFolder(folder.FolderPath);
                }
            }

            return false;
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

        public List<FolderModel> GetSubFoldersByParentId(ObjectId parentId, string folderType)
        {
            if (folderType == "Personal")
            {
                PersonalFolder parentFolder = _personalFolders.Find(f => f.Id == parentId).FirstOrDefault();
                if (parentFolder != null)
                {
                    var personalFilter = Builders<PersonalFolder>.Filter.Eq("ParentId", parentId);
                    var personalFolders = _personalFolders.Find(personalFilter).ToList();
                    return personalFolders.Cast<FolderModel>().ToList();
                }
            }
            else
            {
                FolderModel parentFolder = _folders.Find(f => f.Id == parentId).FirstOrDefault();
                if (parentFolder != null)
                {
                    var filter = Builders<FolderModel>.Filter.Eq("ParentId", parentId);
                    return _folders.Find(filter).ToList();
                }
            }

            return new List<FolderModel>();
        }

        public bool CreatePhysicalFolder(string folderPath)
        {
            try
            {
                string fullPath = Path.Combine(basePath, folderPath);

                if (!Directory.Exists(fullPath))
                {
                    Directory.CreateDirectory(fullPath);
                    return true;
                }

                return false;
            }
            catch
            {
                return false;
            }
        }

        public bool MovePhysicalFolder(string oldFolderPath, string newFolderPath)
        {
            string fullOldPath = Path.Combine(basePath, oldFolderPath);
            string fullNewPath = Path.Combine(basePath, newFolderPath);

            if (!Directory.Exists(fullOldPath)) return false;

            try
            {
                Directory.Move(fullOldPath, fullNewPath);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public bool RenamePhysicalFolder(string folderPath, string newName)
        {
            string fullOldPath = Path.Combine(basePath, folderPath);
            string fullNewPath = Path.Combine(basePath, Path.GetDirectoryName(folderPath), newName);

            if (!Directory.Exists(fullOldPath)) return false;

            try
            {
                Directory.Move(fullOldPath, fullNewPath);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public bool DeletePhysicalFolder(string folderPath)
        {
            string fullPath = Path.Combine(basePath, folderPath);

            if (!Directory.Exists(fullPath)) return false;

            try
            {
                Directory.Delete(fullPath, true);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> BuildFolderPath(ObjectId folderId, bool isPersonal)
        {
            var currentFolder = await GetFolderById(folderId, isPersonal);
            string serverName = Dns.GetHostName();
            string path = currentFolder.FolderPath.Replace("C:/", $"//{serverName}/");
            return path;
        }

        public string GetContentType(string filePath)
        {
            string contentType = "application/octet-stream";
            string fileExtension = Path.GetExtension(filePath).ToLowerInvariant();
            if (!string.IsNullOrEmpty(fileExtension))
            {
                switch (fileExtension)
                {
                    case ".pdf":
                        contentType = "application/pdf";
                        break;
                    case ".txt":
                        contentType = "text/plain";
                        break;
                    case ".csv":
                        contentType = "text/csv";
                        break;
                    case ".xlsx":
                        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                        break;
                    case ".json":
                        contentType = "application/json";
                        break;
                    default:
                        break;
                }
            }
            return contentType;
        }
    }
}
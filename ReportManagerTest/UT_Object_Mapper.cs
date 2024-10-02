using Microsoft.VisualStudio.TestTools.UnitTesting;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManagerTest;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static ReportManager.API.FolderController;

namespace ReportManagerTest
{
    [TestClass]
    public class UTObjectMapperTests
    {
        [TestInitialize]
        public void TestInitialize()
        {
            Environment.SetEnvironmentVariable("ReportManager_ENCRYPTION_KEY", "2flkCJqIvrPsNwjE4GULKarlM5nv3h6imIxefR0S0JA=");
            Environment.SetEnvironmentVariable("ReportManager_ENCRYPTION_IV", "Vfeo5SGD8S1muxsy+UKb8Q==");
        }

        [TestMethod]
        public void TestObjectMapper()
        {

            SharedService sharedService = new SharedService();
        }

        [TestMethod]
        public void TestObjectMapper_MapsUpdateFolderRequestToPersonalFolder()
        {
            var sharedService = new SharedService();
            // static for more straightforward testing
            var folderId = new ObjectId("66fca7e6ea0cb8b65a3e57c5");
            var parentId = new ObjectId("66fca7e6ea0cb8b65a3e57c6");
            var ownerId = new ObjectId("66fca7e6ea0cb8b65a3e57c7");

            var updateFolderRequest = new UpdateFolderRequest
            {
                FolderName = "Test Folder",
                FolderPath = "/test/path",
                FolderType = "Personal",
                Id = folderId.ToString(),
                ParentId = parentId.ToString(),
                IsGroupFolder = false,
                OwnerId = ownerId.ToString()
            };

            var result = sharedService.MapObjectToModel<PersonalFolder>(updateFolderRequest);

            Assert.IsNotNull(result);
            Assert.AreEqual(updateFolderRequest.FolderName, result.FolderName);
            Assert.AreEqual(updateFolderRequest.FolderPath, result.FolderPath);
            Assert.AreEqual(folderId, result.Id);
            Assert.AreEqual(parentId, result.ParentId);
            Assert.AreEqual(ownerId, result.Owner);
        }

        [TestMethod]
        public void FolderDTO_ConvertsFromFolderModel_Correctly()
        {
            var folderModel = new FolderModel
            {
                Id = ObjectId.GenerateNewId(),
                ParentId = ObjectId.GenerateNewId(),
                FolderName = "Test Folder",
                FolderPath = "/test/path",
                IsObjectFolder = true
            };
            var folderDTO = new FolderDTO(folderModel);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(folderModel.Id.ToString(), folderDTO.Id);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(folderModel.ParentId.ToString(), folderDTO.ParentId);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(folderModel.FolderName, folderDTO.FolderName);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(folderModel.FolderPath, folderDTO.FolderPath);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(folderModel.IsObjectFolder, folderDTO.IsGroupFolder);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.IsNull(folderDTO.Owner);
        }

        [TestMethod]
        public void FolderDTO_ConvertsFromPersonalFolder_Correctly()
        {
            var personalFolder = new PersonalFolder
            {
                Id = ObjectId.GenerateNewId(),
                ParentId = ObjectId.GenerateNewId(),
                FolderName = "Personal Folder",
                FolderPath = "/personal/path",
                IsObjectFolder = false,
                Owner = ObjectId.GenerateNewId()
            };
            var folderDTO = new FolderDTO(personalFolder);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(personalFolder.Owner.ToString(), folderDTO.Owner);
        }

        [TestMethod]
        public void GroupDTO_ConvertsFromGroupModel_Correctly()
        {
            var groupModel = new _Group
            {
                Id = ObjectId.GenerateNewId(),
                GroupName = "Test Group",
                GroupOwners = new HashSet<string> { "Owner1", "Owner2" },
                GroupMembers = new HashSet<string> { "Member1", "Member2" },
                Folders = new HashSet<ObjectId> { ObjectId.GenerateNewId(), ObjectId.GenerateNewId() },
                GroupConnectionStrings = new HashSet<ObjectId> { ObjectId.GenerateNewId(), ObjectId.GenerateNewId() },
                IsTopGroup = true,
                ParentId = ObjectId.GenerateNewId()
            };
            var groupDTO = new GroupDTO(groupModel);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(groupModel.Id.ToString(), groupDTO.Id);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(groupModel.GroupName, groupDTO.GroupName);
        }

        [TestMethod]
        public void DBConnectionDTO_ConvertsFromDBConnectionModel_Correctly()
        {
            var dbConnectionModel = new DBConnectionModel
            {
                Id = ObjectId.GenerateNewId(),
                ServerName = "Test Server",
                Port = 1234,
                DbType = "SQL",
                DatabaseName = "TestDB",
                FriendlyName = "Test Connection",
                Username = "TestUser",
                Password = "TestPassword",
                AuthType = "Basic",
                OwnerID = ObjectId.GenerateNewId(),
                OwnerType = OwnerType.Personal
            };

            var dbConnectionDTO = new DBConnectionDTO(dbConnectionModel);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(dbConnectionModel.Id.ToString(), dbConnectionDTO.Id);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(dbConnectionModel.ServerName, dbConnectionDTO.ServerName);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(dbConnectionModel.Port, dbConnectionDTO.Port);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(dbConnectionModel.DbType, dbConnectionDTO.DbType);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(dbConnectionModel.DatabaseName, dbConnectionDTO.DatabaseName);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(dbConnectionModel.FriendlyName, dbConnectionDTO.FriendlyName);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(dbConnectionModel.Username, dbConnectionDTO.Username);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual("TestPassword", dbConnectionDTO.Password);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(dbConnectionModel.AuthType, dbConnectionDTO.AuthType);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(dbConnectionModel.OwnerID.ToString(), dbConnectionDTO.OwnerID);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(dbConnectionModel.OwnerType.ToString(), dbConnectionDTO.OwnerType);
        }
    }
}
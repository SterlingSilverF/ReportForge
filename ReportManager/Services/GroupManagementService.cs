using MongoDB.Bson;
using MongoDB.Driver;
using ReportManager.Models;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace ReportManager.Services
{
    public class GroupManagementService
    {
        private readonly IMongoCollection<_Group> _groupsDB;

        public GroupManagementService(AppDatabaseService databaseService)
        {
            _groupsDB = databaseService.GetCollection<_Group>("Groups");
        }

        public bool CreateGroup(_Group group)
        {
            if (DoesGroupExist(group.Id))
                return false;
            _groupsDB.InsertOne(group);
            return true;
        }

        public _Group CreateAdminGroup(_Group group)
        {
            _groupsDB.InsertOne(group);
            return group;
        }

        public bool UpdateGroup(_Group updatedGroup)
        {
            var filter = Builders<_Group>.Filter.Eq(g => g.Id, updatedGroup.Id);
            var result = _groupsDB.ReplaceOne(filter, updatedGroup);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public bool DeleteGroup(ObjectId groupId)
        {
            var filter = Builders<_Group>.Filter.Eq(g => g.Id, groupId);
            var result = _groupsDB.DeleteOne(filter);
            return result.IsAcknowledged && result.DeletedCount > 0;
        }

        public bool AddUserToGroup(ObjectId groupId, ObjectId userId)
        {
            var filter = Builders<_Group>.Filter.Eq(g => g.Id, groupId);
            var update = Builders<_Group>.Update.AddToSet(g => g.GroupMembers, userId);
            var result = _groupsDB.UpdateOne(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public bool RemoveUserFromGroup(ObjectId groupId, ObjectId userId)
        {
            var filter = Builders<_Group>.Filter.Eq(g => g.Id, groupId);
            var update = Builders<_Group>.Update.Pull(g => g.GroupMembers, userId);
            var result = _groupsDB.UpdateOne(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public _Group GetGroup(ObjectId groupId)
        {
            var filter = Builders<_Group>.Filter.Eq(g => g.Id, groupId);
            return _groupsDB.Find(filter).FirstOrDefault();
        }

        public bool DoesGroupExist(ObjectId groupId)
        {
            return _groupsDB.CountDocuments(g => g.Id == groupId) > 0;
        }

        public _Group? GetGroupByName(string groupName)
        {
            var filter = Builders<_Group>.Filter.Eq(g => g.GroupName, groupName);
            return _groupsDB.Find(filter).FirstOrDefault();
        }

        public List<_Group> ListGroups()
        {
            return _groupsDB.Find(_ => true).ToList();
        }

        public List<_Group> GetGroupsByUser(ObjectId userId)
        {
            var filter = Builders<_Group>.Filter.AnyEq(g => g.GroupMembers, userId);
            return _groupsDB.Find(filter).ToList();
        }

        public _Group GetTopGroup()
        {
            var filter = Builders<_Group>.Filter.Eq(g => g.IsTopGroup, true);
            return _groupsDB.Find(filter).FirstOrDefault();
        }

        public string ModifyGroupOwnership(ObjectId groupId, List<ObjectId> newOwners)
        {
            var filter = Builders<_Group>.Filter.Eq(g => g.Id, groupId);
            var update = Builders<_Group>.Update.Set(g => g.GroupOwners, newOwners);
            var result = _groupsDB.UpdateOne(filter, update);

            return result.IsAcknowledged && result.ModifiedCount > 0 ? "Group ownership updated" : "Update failed";
        }
    }
}
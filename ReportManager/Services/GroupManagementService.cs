using MongoDB.Bson;
using MongoDB.Driver;
using ReportManager.Models;
using System.Text.RegularExpressions;

namespace ReportManager.Services
{
    public class GroupManagementService
    {
        private readonly IMongoCollection<_Group> _groupsDB;
        private readonly SharedUtils _sharedUtils;

        public GroupManagementService(IConfiguration config, SharedUtils sharedUtils)
        {
            var connectionString = config.GetValue<string>("ConnectionSettings:MongoConnectionString");
            var client = new MongoClient(connectionString);
            var database = client.GetDatabase("ReportForge");
            _groupsDB = database.GetCollection<_Group>("Groups");

            // TODO: Move this to database creation class
            var indexKeysDefinition = Builders<_Group>.IndexKeys.Ascending(x => x.GroupName);
            var indexOptions = new CreateIndexOptions { Unique = true };
            var indexModel = new CreateIndexModel<_Group>(indexKeysDefinition, indexOptions);
            _groupsDB.Indexes.CreateOne(indexModel);
            _sharedUtils = sharedUtils;
        }

        public bool CreateGroup(_Group group)
        {
            if (_sharedUtils.DoesGroupExist(group.Id))
                return false;

            _groupsDB.InsertOne(group);
            return true;
        }

        public bool UpdateGroup(ObjectId groupId, _Group updatedGroup)
        {
            var filter = Builders<_Group>.Filter.Eq(g => g.Id, groupId);
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

        public List<_Group> ListGroups()
        {
            return _groupsDB.Find(_ => true).ToList();
        }

        public List<_Group> GetGroupsByUserName(ObjectId userId)
        {
            var filter = Builders<_Group>.Filter.AnyEq(g => g.GroupMembers, userId);
            return _groupsDB.Find(filter).ToList();
        }
    }
}
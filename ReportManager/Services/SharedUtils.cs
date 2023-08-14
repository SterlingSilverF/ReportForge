using MongoDB.Bson;
using MongoDB.Driver;
using ReportManager.Models;
using System.Text.RegularExpressions;

namespace ReportManager.Services
{
    public class SharedUtils
    {
        private readonly IMongoCollection<_Group> _groups;
        private readonly UserManagementService _userManagementService;
        private readonly GroupManagementService _groupManagementService;

        public SharedUtils(IMongoDatabase database, UserManagementService userManagementService, GroupManagementService groupManagementService)
        {
            _groups = database.GetCollection<_Group>("Groups");
            _userManagementService = userManagementService;
            _groupManagementService = groupManagementService;
        }

        public bool DoesGroupExist(ObjectId groupId)
        {
            var filter = Builders<_Group>.Filter.Eq(g => g.Id, groupId);
            var result = _groups.Find(filter).FirstOrDefault();

            return result != null;
        }

        public string FirstTimeSetupAdmin(User firstUser, _Group firstGroup)
        {
            if (!_groupManagementService.CreateGroup(firstGroup))
            {
                return "Failed to create base group.";
            }

            if (_userManagementService.RegisterUser(firstUser, firstGroup.Id) != "User created successfully.")
            {
                return "Failed to create user.";
            }

            _groupManagementService.AddUserToGroup(firstGroup.Id, firstUser.Id);

            // TODO Perform any other setup actions needed.

            return "Success.";
        }
    }
}


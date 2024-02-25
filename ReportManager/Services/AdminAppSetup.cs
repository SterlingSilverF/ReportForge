using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using ReportManager.Models;
using ReportManager.Services;
using System.Linq;

namespace ReportManager
{
    public class AdminAppSetup
    {
        private readonly IConfiguration _configuration;
        private readonly AppDatabaseService _appDatabaseService;

        public AdminAppSetup(IConfiguration configuration, AppDatabaseService appDatabaseService)
        {
            _configuration = configuration;
            _appDatabaseService = appDatabaseService;
        }

        public bool IsValidSetupKey(string permissionKey)
        {
            string setupKey = _configuration.GetValue<string>("SetupKey");
            return setupKey == permissionKey;
        }

        public bool CreateDatabaseCollections()
        {
            try
            {
                var database = _appDatabaseService.GetDatabase();

                bool dropResult = DropAllCollections(database);
                if (!dropResult)
                {
                    Console.WriteLine("No collections to drop");
                }

                database.CreateCollection("Users");
                database.CreateCollection("PermissionKeys");
                database.CreateCollection("Groups");
                database.CreateCollection("GroupFolders");
                database.CreateCollection("GroupServerConnections");
                database.CreateCollection("GroupDBConnections");
                database.CreateCollection("GroupReports");
                database.CreateCollection("PersonalFolders");
                database.CreateCollection("PersonalServerConnections");
                database.CreateCollection("PersonalDBConnections");
                database.CreateCollection("PersonalReports");
                database.CreateCollection("ConnectionStrings");

                // Indexing
                // Group
                var groupIndexKeysDefinition = Builders<_Group>.IndexKeys.Ascending(x => x.GroupName);
                var groupIndexOptions = new CreateIndexOptions { Unique = true };
                var groupIndexModel = new CreateIndexModel<_Group>(groupIndexKeysDefinition, groupIndexOptions);
                _appDatabaseService.GetCollection<_Group>("Groups").Indexes.CreateOne(groupIndexModel);

                // Permission Key
                var permIndexKeysDefinition = Builders<PermissionKeyModel>.IndexKeys.Ascending(x => x.Timestamp);
                var permIndexOptions = new CreateIndexOptions { Name = "TimestampIndex" };
                var permIndexModel = new CreateIndexModel<PermissionKeyModel>(permIndexKeysDefinition, permIndexOptions);
                _appDatabaseService.GetCollection<PermissionKeyModel>("PermissionKeys").Indexes.CreateOne(permIndexModel);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public bool DropAllCollections(IMongoDatabase database)
        {
            try
            {
                // Fetch all collection names in the database
                var collectionNames = database.ListCollectionNames();

                // Drop each collection
                collectionNames.ForEachAsync(name => database.DropCollection(name));
                return true;
            }
            catch (Exception e)
            {
                //Console.WriteLine($"An error occurred: {e.Message}");
                return false;
            }
        }
    }
}
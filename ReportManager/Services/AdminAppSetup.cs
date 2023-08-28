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

        public async Task CreateDatabaseCollections()
        {
            var database = _appDatabaseService.GetDatabase();

            bool dropResult = await DropAllCollectionsAsync(database);
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
        }

        public async Task<bool> DropAllCollectionsAsync(IMongoDatabase database)
        {
            try
            {
                // Fetch all collection names in the database
                var collectionNames = await database.ListCollectionNamesAsync();

                // Drop each collection
                await collectionNames.ForEachAsync(async name => await database.DropCollectionAsync(name));

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
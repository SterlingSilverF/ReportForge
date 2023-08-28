using MongoDB.Driver;

public class AppDatabaseService
{
    private readonly IMongoDatabase _database;

    public AppDatabaseService(IConfiguration config)
    {
        var connectionString = config.GetValue<string>("ConnectionSettings:MongoConnectionString");
        var client = new MongoClient(connectionString);
        _database = client.GetDatabase("ReportForge");
    }

    public IMongoDatabase GetDatabase()
    {
        return _database;
    }

    public IMongoCollection<T> GetCollection<T>(string name)
    {
        return _database.GetCollection<T>(name);
    }
}

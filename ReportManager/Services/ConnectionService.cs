using System.Collections.Generic;
using MongoDB.Driver;
using MongoDB.Bson;
using Oracle.ManagedDataAccess.Client;
using MySql.Data.MySqlClient;
using System.Data.SqlClient;
using Npgsql;
using IBM.Data.DB2.Core;
using System;
using ReportManager.Models;
using System.Linq;
using Microsoft.Extensions.Options;
using ReportManager.Models.SettingsModels;
using System.Collections;
using Microsoft.AspNetCore.Mvc;

public class ConnectionService
{
    private MongoClient _client;
    private IMongoDatabase _database;

    public ConnectionService(IOptions<ConnectionSettings> settings)
    {
        _client = new MongoClient(settings.Value.MongoConnectionString);
        _database = _client.GetDatabase(settings.Value.MongoDbName);
    }

    public IMongoCollection<ServerConnectionModel> GetServerCollection(ServerConnectionModel conn)
    {
        string collectionName = conn.OwnerType == OwnerType.User ? "PersonalServerConnections" : "GroupServerConnections";
        return _database.GetCollection<ServerConnectionModel>(collectionName);
    }

    public IMongoCollection<DBConnectionModel> GetDBCollection(ServerConnectionModel conn)
    {
        string collectionName = conn.OwnerType == OwnerType.User ? "PersonalDBConnections" : "GroupDBConnections";
        return _database.GetCollection<DBConnectionModel>(collectionName);
    }

    // First step in creating a new connection is to provide the server information.
    // Password should be encrypted before reaching this
    public async Task<ObjectId?> AddServerConnection(ServerConnectionModel serverConnection, bool saveConnection)
    {
        var (isSuccessful, message) = PreviewConnection(serverConnection);
        if (!isSuccessful)
        {
            return null;
        }

        if (!saveConnection)
        {
            return serverConnection.Id;
        }

        var collection = GetServerCollection(serverConnection);
        await collection.InsertOneAsync(serverConnection);
        System.Diagnostics.Debug.WriteLine($"New server connection saved for {serverConnection.Id} under {serverConnection.OwnerID}");
        return serverConnection.Id;
    }

    public async Task<ObjectId?> SaveNewDBConnection(DBConnectionModel connectionModel)
    {
        connectionModel.Password = connectionModel.Password;
        var collection = GetDBCollection(connectionModel);
        await collection.InsertOneAsync(connectionModel);
        System.Diagnostics.Debug.WriteLine($"New DB connection saved for {connectionModel.Id} under {connectionModel.OwnerID}");
        return connectionModel.Id;
    }

    // TODO: break DB string build functionality into separate function
    public static string BuildConnectionString(DBConnectionModel dbConnection)
    {
        switch (dbConnection.DbType)
        {
            case "MSSQL":
                if (dbConnection.AuthType == "Windows")
                {
                    if (!string.IsNullOrEmpty(dbConnection.Instance))
                    {
                        return $"Server={dbConnection.ServerName},{dbConnection.Port}\\{dbConnection.Instance};Integrated Security=True;";
                    }
                    return $"Server={dbConnection.ServerName},{dbConnection.Port};Integrated Security=True;";
                }
                else
                {
                    if (!string.IsNullOrEmpty(dbConnection.Instance))
                    {
                        return $"Server={dbConnection.ServerName},{dbConnection.Port}\\{dbConnection.Instance};User Id={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};";
                    }
                    return $"Server={dbConnection.ServerName},{dbConnection.Port};User Id={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};";
                }

            case "Oracle":
                if (dbConnection.AuthType == "Windows")
                {
                    return $"Data Source={dbConnection.ServerName};Integrated Security=yes;";
                }
                else if (dbConnection.AuthType == "UsernamePassword")
                {
                    return $"Data Source={dbConnection.ServerName};User Id={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};Integrated Security=no;";
                }
                else if (dbConnection.AuthType == "TNSNamesOra")
                {
                    return $"Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={dbConnection.ServerName})(PORT={dbConnection.Port}))(CONNECT_DATA=(SERVICE_NAME={dbConnection.Instance})));User Id={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};";
                }
                throw new ArgumentException("Unsupported Oracle authentication type.");

            case "MySQL":
                return $"server={dbConnection.ServerName};port={dbConnection.Port};uid={dbConnection.Username};pwd={Encryptor.Decrypt(dbConnection.Password)};";

            case "Postgres":
                return $"Host={dbConnection.ServerName};Port={dbConnection.Port};Username={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};";

            case "MongoDB":
                // Assuming there's no need for the database name in the connection string.
                return $"mongodb://{dbConnection.Username}:{Encryptor.Decrypt(dbConnection.Password)}@{dbConnection.ServerName}:{dbConnection.Port}";

            case "DB2":
                return $"Server={dbConnection.ServerName}:{dbConnection.Port};Database={dbConnection.DatabaseName};UserID={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};";

            default:
                throw new ArgumentException("Unsupported database type.");
        }
    }

    public (bool, string) PreviewConnection(ServerConnectionModel serverConnection)
    {
        try
        {
            string? databaseName = serverConnection is DBConnectionModel dbConnection ? dbConnection.DatabaseName : serverConnection.Instance;

            switch (serverConnection.DbType)
            {
                case "MSSQL":
                    using (SqlConnection sqlConnection = new SqlConnection($"Server={serverConnection.ServerName},{serverConnection.Port};Database={serverConnection.Instance};User Id={serverConnection.Username};Password={serverConnection.Password};"))
                    {
                        sqlConnection.Open();
                        if (!string.IsNullOrEmpty(databaseName))
                        {
                            using (SqlCommand cmd = new SqlCommand($"SELECT db_id('{databaseName}')", sqlConnection))
                            {
                                object result = cmd.ExecuteScalar();
                                if (result == DBNull.Value || result == null)
                                {
                                    return (false, "Database does not exist.");
                                }
                            }
                        }
                        sqlConnection.Close();
                    }
                    break;
                case "Oracle":
                    string oracleConnectionString = $"User Id={serverConnection.Username};Password={serverConnection.Password};Data Source={serverConnection.ServerName}:{serverConnection.Port}/{serverConnection.Instance};";
                    using (OracleConnection oracleConnection = new OracleConnection(oracleConnectionString))
                    {
                        oracleConnection.Open();
                        if (!string.IsNullOrEmpty(databaseName))
                        {
                            using (OracleCommand cmd = new OracleCommand($"SELECT 1 FROM dba_databases WHERE name = '{databaseName}'", oracleConnection))
                            {
                                object result = cmd.ExecuteScalar();
                                if (result == null)
                                {
                                    return (false, "Database does not exist.");
                                }
                            }
                        }
                        oracleConnection.Close();
                    }
                    break;
                case "MySQL":
                    string mySqlConnectionString = $"server={serverConnection.ServerName};port={serverConnection.Port};database={serverConnection.Instance};uid={serverConnection.Username};pwd={serverConnection.Password};";
                    using (MySqlConnection mySqlConnection = new MySqlConnection(mySqlConnectionString))
                    {
                        mySqlConnection.Open();
                        if (!string.IsNullOrEmpty(databaseName))
                        {
                            using (MySqlCommand cmd = new MySqlCommand($"SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '{databaseName}'", mySqlConnection))
                            {
                                object result = cmd.ExecuteScalar();
                                if (result == null)
                                {
                                    return (false, "Database does not exist.");
                                }
                            }
                        }
                        mySqlConnection.Close();
                    }
                    break;
                case "Postgres":
                    string pgConnectionString = $"Host={serverConnection.ServerName};Port={serverConnection.Port};Database={serverConnection.Instance};Username={serverConnection.Username};Password={serverConnection.Password}";
                    using (NpgsqlConnection pgConnection = new NpgsqlConnection(pgConnectionString))
                    {
                        pgConnection.Open();
                        if (!string.IsNullOrEmpty(databaseName))
                        {
                            using (NpgsqlCommand cmd = new NpgsqlCommand($"SELECT 1 FROM pg_database WHERE datname = '{databaseName}'", pgConnection))
                            {
                                object result = cmd.ExecuteScalar();
                                if (result == null)
                                {
                                    return (false, "Database does not exist.");
                                }
                            }
                        }
                        pgConnection.Close();
                    }
                    break;
                case "MongoDB":
                    var mongoClient = new MongoClient($"mongodb://{serverConnection.Username}:{serverConnection.Password}@{serverConnection.ServerName}:{serverConnection.Port}");
                    mongoClient.GetDatabase("admin").RunCommandAsync((Command<BsonDocument>)"{ping:1}").Wait();

                    if (!string.IsNullOrEmpty(databaseName))
                    {
                        var databases = mongoClient.ListDatabases().ToList();
                        if (!databases.Any(db => db["name"] == databaseName))
                        {
                            return (false, "Database does not exist.");
                        }
                    }
                    break;
                case "DB2":
                    string db2ConnectionString = $"Server={serverConnection.ServerName}:{serverConnection.Port};Database={serverConnection.Instance};UserID={serverConnection.Username};Password={serverConnection.Password};";
                    using (DB2Connection db2Connection = new DB2Connection(db2ConnectionString))
                    {
                        db2Connection.Open();
                        if (!string.IsNullOrEmpty(databaseName))
                        {
                            using (DB2Command cmd = new DB2Command($"SELECT 1 FROM syscat.databases WHERE name = '{databaseName}'", db2Connection))
                            {
                                object result = cmd.ExecuteScalar();
                                if (result == null)
                                {
                                    return (false, "Database does not exist.");
                                }
                            }
                        }
                        db2Connection.Close();
                    }
                    break;
                default:
                    return (false, "Unsupported database type.");
            }

            return (true, "Connection successful.");
        }
        catch (Exception ex) when (
        ex is SqlException sqlEx && sqlEx.Number == 18456 ||
        ex is OracleException oraEx && oraEx.Number == 1017 ||
        ex is MySqlException mySqlEx && mySqlEx.Number == 1045 ||
        ex is NpgsqlException pgEx && pgEx.ErrorCode == 21000 ||
        ex is MongoException mongoEx && mongoEx.Message.Contains("Authentication failed") ||
        ex is DB2Exception db2Ex && db2Ex.Message.Contains("INVALID USER OR PASSWORD"))
        {
            return (false, "Authentication failed.");
        }
        catch (Exception ex) when (
            ex is SqlException sqlEx && sqlEx.Number == -2 ||
            ex is OracleException oraEx && oraEx.Number == 12170 ||
            ex is MySqlException mySqlEx && mySqlEx.Number == 1042 ||
            ex is NpgsqlException pgEx && pgEx.ErrorCode == 0 ||
            ex is DB2Exception db2Ex && db2Ex.Message.Contains("INVALID SERVER NAME"))
        {
            return (false, "Connection timed out.");
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }

    public List<ServerConnectionModel> GetServerConnections(string ownerID, OwnerType ownerType)
    {
        string collectionName = ownerType == OwnerType.User ? "PersonalServerConnections" : "GroupServerConnections";
        var collection = _database.GetCollection<ServerConnectionModel>(collectionName);
        var filter = Builders<ServerConnectionModel>.Filter.Eq("OwnerID", new ObjectId(ownerID));
        return collection.Find(filter).ToList();
    }

    public List<DBConnectionModel> GetDBConnections(string ownerID, OwnerType ownerType)
    {
        string collectionName = ownerType == OwnerType.User ? "PersonalDBConnections" : "GroupDBConnections";
        var collection = _database.GetCollection<DBConnectionModel>(collectionName);
        var filter = Builders<DBConnectionModel>.Filter.Eq("OwnerID", new ObjectId(ownerID));
        return collection.Find(filter).ToList();
    }

    public ServerConnectionModel? FetchServerConnection(List<ServerConnectionModel> serverConnections, ObjectId connectionId)
    {
        return serverConnections.FirstOrDefault(sc => sc.Id == connectionId);
    }

    public DBConnectionModel? FetchDBConnection(List<DBConnectionModel> dbConnections, ObjectId connectionId)
    {
        return dbConnections.FirstOrDefault(db => db.Id == connectionId);
    }

    public ServerConnectionModel? GetServerConnectionById(ObjectId connectionId, OwnerType ownerType)
    {
        var collection = GetServerCollection(new ServerConnectionModel { OwnerType = ownerType });
        var filter = Builders<ServerConnectionModel>.Filter.Eq("_id", connectionId);
        return collection.Find(filter).FirstOrDefault();
    }

    public DBConnectionModel? GetDBConnectionById(ObjectId connectionId, OwnerType ownerType)
    {
        var collection = GetDBCollection(new ServerConnectionModel { OwnerType = ownerType });
        var filter = Builders<DBConnectionModel>.Filter.Eq("_id", connectionId);
        return collection.Find(filter).FirstOrDefault();
    }

    public IEnumerable<dynamic> FetchDataFromMongoDB(string objectName)
    {
        var collection = _database.GetCollection<BsonDocument>(objectName);
        var documents = collection.Find(new BsonDocument()).ToList();
        List<dynamic> results = new List<dynamic>();
        foreach (var doc in documents)
        {
            results.Add(BsonTypeMapper.MapToDotNetValue(doc));
        }
        return results;
    }

    public DBConnectionModel BuildDBConnectionModel(ServerConnectionModel serverConnection)
    {
        DBConnectionModel dbConnection = new DBConnectionModel();
        dbConnection.DbType = serverConnection.DbType;
        dbConnection.Username = serverConnection.Username;
        dbConnection.Password = serverConnection.Password;
        return dbConnection;
    }

    public bool DeleteServerConnection(ObjectId connectionId)
    {
        var collection = _database.GetCollection<ServerConnectionModel>("ServerConnections");
        var result = collection.DeleteOne(x => x.Id == connectionId);
        return result.IsAcknowledged && result.DeletedCount > 0;
    }

    public bool DeleteDBConnection(ObjectId connectionId)
    {
        var collection = _database.GetCollection<DBConnectionModel>("DBConnections");
        var result = collection.DeleteOne(x => x.Id == connectionId);
        return result.IsAcknowledged && result.DeletedCount > 0;
    }

    public bool UpdateServerConnection(ServerConnectionModel updatedServer)
    {
        var collection = GetServerCollection(updatedServer);
        var result = collection.ReplaceOne(x => x.Id == updatedServer.Id, updatedServer);
        return result.IsAcknowledged && result.ModifiedCount > 0;
    }

    public bool UpdateDBConnection(DBConnectionModel updatedDB)
    {
        var collection = GetDBCollection(updatedDB);
        var result = collection.ReplaceOne(x => x.Id == updatedDB.Id, updatedDB);
        return result.IsAcknowledged && result.ModifiedCount > 0;
    }
}
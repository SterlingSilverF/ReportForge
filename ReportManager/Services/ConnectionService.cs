﻿using System.Collections.Generic;
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
    public ObjectId? ServerConnection(ServerConnectionModel serverConnection, bool saveConnection)
    {
        var (isSuccessful, message) = PreviewConnection(serverConnection);
        if (!isSuccessful)
        {
            return null;
        }

        if (!saveConnection)
        {
            return serverConnection.ConnectionID;
        }

        var collection = GetServerCollection(serverConnection);
        collection.InsertOne(serverConnection);
        Console.WriteLine($"New server connection saved for {serverConnection.ConnectionID} under {serverConnection.OwnerID}");
        return serverConnection.ConnectionID;
    }

    public ObjectId SaveNewDBConnection(DBConnectionModel connectionModel)
    {
        connectionModel.Password = connectionModel.Password;
        var collection = GetDBCollection(connectionModel);
        collection.InsertOne(connectionModel);
        Console.WriteLine($"New DB connection saved for {connectionModel.ConnectionID} under {connectionModel.OwnerID}");
        return connectionModel.ConnectionID;
    }

    public static string BuildConnectionString(DBConnectionModel dbConnection)
    {
        switch (dbConnection.DbType)
        {
            case "MSSQL":
                if (dbConnection.AuthType == "Windows")
                {
                    if (!string.IsNullOrEmpty(dbConnection.Instance))
                    {
                        return $"Server={dbConnection.Server},{dbConnection.Port}\\{dbConnection.Instance};Integrated Security=True;";
                    }
                    return $"Server={dbConnection.Server},{dbConnection.Port};Integrated Security=True;";
                }
                else
                {
                    if (!string.IsNullOrEmpty(dbConnection.Instance))
                    {
                        return $"Server={dbConnection.Server},{dbConnection.Port}\\{dbConnection.Instance};User Id={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};";
                    }
                    return $"Server={dbConnection.Server},{dbConnection.Port};User Id={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};";
                }

            case "Oracle":
                if (dbConnection.AuthType == "Windows")
                {
                    return $"Data Source={dbConnection.Server};Integrated Security=yes;";
                }
                else if (dbConnection.AuthType == "UsernamePassword")
                {
                    return $"Data Source={dbConnection.Server};User Id={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};Integrated Security=no;";
                }
                else if (dbConnection.AuthType == "TNSNamesOra")
                {
                    return $"Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={dbConnection.Server})(PORT={dbConnection.Port}))(CONNECT_DATA=(SERVICE_NAME={dbConnection.Instance})));User Id={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};";
                }
                throw new ArgumentException("Unsupported Oracle authentication type.");

            case "MySQL":
                return $"server={dbConnection.Server};port={dbConnection.Port};uid={dbConnection.Username};pwd={Encryptor.Decrypt(dbConnection.Password)};";

            case "Postgres":
                return $"Host={dbConnection.Server};Port={dbConnection.Port};Username={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};";

            case "MongoDB":
                // Assuming there's no need for the database name in the connection string.
                return $"mongodb://{dbConnection.Username}:{Encryptor.Decrypt(dbConnection.Password)}@{dbConnection.Server}:{dbConnection.Port}";

            case "DB2":
                return $"Server={dbConnection.Server}:{dbConnection.Port};Database={dbConnection.DatabaseName};UserID={dbConnection.Username};Password={Encryptor.Decrypt(dbConnection.Password)};";

            default:
                throw new ArgumentException("Unsupported database type.");
        }
    }


    public (bool, string) PreviewConnection(ServerConnectionModel serverConnection)
    {
        try
        {
            switch (serverConnection.DbType)
            {
                case "MSSQL":
                    using (SqlConnection sqlConnection = new SqlConnection($"Server={serverConnection.Server},{serverConnection.Port};Database={serverConnection.Instance};User Id={serverConnection.Username};Password={serverConnection.Password};"))
                    {
                        sqlConnection.Open();
                        sqlConnection.Close();
                    }
                    break;
                case "Oracle":
                    string oracleConnectionString = $"User Id={serverConnection.Username};Password={serverConnection.Password};Data Source={serverConnection.Server}:{serverConnection.Port}/{serverConnection.Instance};";
                    using (OracleConnection oracleConnection = new OracleConnection(oracleConnectionString))
                    {
                        oracleConnection.Open();
                        oracleConnection.Close();
                    }
                    break;
                case "MySQL":
                    string mySqlConnectionString = $"server={serverConnection.Server};port={serverConnection.Port};database={serverConnection.Instance};uid={serverConnection.Username};pwd={serverConnection.Password};";
                    using (MySqlConnection mySqlConnection = new MySqlConnection(mySqlConnectionString))
                    {
                        mySqlConnection.Open();
                        mySqlConnection.Close();
                    }
                    break;
                case "Postgres":
                    string pgConnectionString = $"Host={serverConnection.Server};Port={serverConnection.Port};Database={serverConnection.Instance};Username={serverConnection.Username};Password={serverConnection.Password}";
                    using (NpgsqlConnection pgConnection = new NpgsqlConnection(pgConnectionString))
                    {
                        pgConnection.Open();
                        pgConnection.Close();
                    }
                    break;
                case "MongoDB":
                    var mongoClient = new MongoClient($"mongodb://{serverConnection.Username}:{serverConnection.Password}@{serverConnection.Server}:{serverConnection.Port}");
                    var mongoDatabase = mongoClient.GetDatabase(serverConnection.Instance);
                    mongoDatabase.RunCommandAsync((Command<BsonDocument>)"{ping:1}").Wait();
                    break;
                case "DB2":
                    string db2ConnectionString = $"Server={serverConnection.Server}:{serverConnection.Port};Database={serverConnection.Instance};UserID={serverConnection.Username};Password={serverConnection.Password};";
                    using (DB2Connection db2Connection = new DB2Connection(db2ConnectionString))
                    {
                        db2Connection.Open();
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
        return serverConnections.FirstOrDefault(sc => sc.ConnectionID == connectionId);
    }

    public DBConnectionModel? FetchDBConnection(List<DBConnectionModel> dbConnections, ObjectId serverId, string databaseName)
    {
        return dbConnections.FirstOrDefault(db => db.DatabaseName == databaseName && db.ConnectionID == serverId);
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
}
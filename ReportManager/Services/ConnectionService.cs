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
using Microsoft.AspNetCore.Mvc;
using System.Text;
using ReportManager.Services;
using MongoDB.Driver.Core.Connections;

public class ConnectionService
{
    private MongoClient _client;
    private IMongoDatabase _database;

    public ConnectionService(IOptions<ConnectionSettings> settings)
    {
        _client = new MongoClient(settings.Value.MongoConnectionString);
        _database = _client.GetDatabase(settings.Value.MongoDbName);
    }

    public IMongoCollection<BaseConnectionModel> GetServerCollection(OwnerType ownerType)
    {
        string collectionName = ownerType == OwnerType.Personal ? "PersonalServerConnections" : "GroupServerConnections";
        return _database.GetCollection<BaseConnectionModel>(collectionName);
    }

    public IMongoCollection<DBConnectionModel> GetDBCollection(OwnerType ownerType)
    {
        string collectionName = ownerType == OwnerType.Personal ? "PersonalDBConnections" : "GroupDBConnections";
        return _database.GetCollection<DBConnectionModel>(collectionName);
    }

    public async Task UpdateBuiltConnectionString(BuiltConnectionString connStr)
    {
        var connectionStringCollection = _database.GetCollection<BuiltConnectionString>("ConnectionStrings");
        var existingConnStr = await connectionStringCollection.Find(Builders<BuiltConnectionString>.Filter.Eq("_id", connStr.Id)).FirstOrDefaultAsync();
        if (existingConnStr == null)
        {
            throw new InvalidOperationException("Connection string does not exist.");
        }

        var update = Builders<BuiltConnectionString>.Update
            .Set(c => c.EncryptedConnectionString, connStr.EncryptedConnectionString);

        await connectionStringCollection.UpdateOneAsync(Builders<BuiltConnectionString>.Filter.Eq("_id", connStr.Id), update);
    }

    public async Task AddConnectionString(BuiltConnectionString connStr)
    {
        var connectionStringCollection = _database.GetCollection<BuiltConnectionString>("ConnectionStrings");
        var existingDocument = await connectionStringCollection.Find(x => x.ConnectionId == connStr.ConnectionId).FirstOrDefaultAsync();
        if (existingDocument != null)
        {
            await UpdateBuiltConnectionString(connStr);
            return;
        }

        await connectionStringCollection.InsertOneAsync(connStr);
    }

    public async Task<string> FetchAndDecryptConnectionString(ObjectId connectionId)
    {
        var builtConnectionString = await _database.GetCollection<BuiltConnectionString>("ConnectionStrings")
                                                    .Find(x => x.ConnectionId == connectionId)
                                                    .FirstOrDefaultAsync();
        if (builtConnectionString == null)
        {
            throw new InvalidOperationException("BuiltConnectionString document not found.");
        }

        return builtConnectionString.GetDecryptedConnectionString();
    }

    public async Task<ObjectId?> GetBuiltConnectionStringId(ObjectId dbConnectionId)
    {
        var connectionStringCollection = _database.GetCollection<BuiltConnectionString>("ConnectionStrings");
        var filter = Builders<BuiltConnectionString>.Filter.Eq(x => x.ConnectionId, dbConnectionId);
        var result = await connectionStringCollection.Find(filter).FirstOrDefaultAsync();
        return result?.Id;
    }

    public async Task<bool> DeleteServerOrDBConnection(ObjectId connectionId, OwnerType ownerType)
    {
        var serverCollection = GetServerCollection(ownerType);
        var dbCollection = GetDBCollection(ownerType);
        var connectionStringCollection = _database.GetCollection<BuiltConnectionString>("ConnectionStrings");

        var serverDeleteResult = await serverCollection.DeleteOneAsync(Builders<BaseConnectionModel>.Filter.Eq("_id", connectionId));
        var dbDeleteResult = await dbCollection.DeleteOneAsync(Builders<DBConnectionModel>.Filter.Eq("_id", connectionId));
        var connectionStringDeleteResult = await connectionStringCollection.DeleteOneAsync(Builders<BuiltConnectionString>.Filter.Eq("ConnectionId", connectionId));

        return serverDeleteResult.IsAcknowledged && serverDeleteResult.DeletedCount > 0 ||
               dbDeleteResult.IsAcknowledged && dbDeleteResult.DeletedCount > 0 ||
               connectionStringDeleteResult.IsAcknowledged && connectionStringDeleteResult.DeletedCount > 0;
    }

    public async Task<ObjectId?> AddServerConnection(BaseConnectionModel serverConnection, bool saveConnection)
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

        var collection = GetServerCollection(serverConnection.OwnerType);
        await collection.InsertOneAsync(serverConnection);
        System.Diagnostics.Debug.WriteLine($"New server connection saved for {serverConnection.Id} under {serverConnection.OwnerID}");
        return serverConnection.Id;
    }

    public async Task<ObjectId?> SaveNewDBConnection(DBConnectionModel connectionModel)
    {
        connectionModel.Password = connectionModel.Password;
        var collection = GetDBCollection(connectionModel.OwnerType);
        await collection.InsertOneAsync(connectionModel);
        System.Diagnostics.Debug.WriteLine($"New DB connection saved for {connectionModel.Id} under {connectionModel.OwnerID}");
        return connectionModel.Id;
    }

    public async Task<BaseConnectionModel?> FindServerConnection(string serverName, int port, string dbType, ObjectId ownerID, OwnerType ownerType)
    {
        string collectionName = ownerType == OwnerType.Personal ? "PersonalServerConnections" : "GroupServerConnections";
        var collection = _database.GetCollection<BaseConnectionModel>(collectionName);

        var filter = Builders<BaseConnectionModel>.Filter.Eq(conn => conn.ServerName, serverName) &
                     Builders<BaseConnectionModel>.Filter.Eq(conn => conn.Port, port) &
                     Builders<BaseConnectionModel>.Filter.Eq(conn => conn.DbType, dbType) &
                     Builders<BaseConnectionModel>.Filter.Eq(conn => conn.OwnerID, ownerID) &
                     Builders<BaseConnectionModel>.Filter.Eq(conn => conn.OwnerType, ownerType);

        return await collection.Find(filter).FirstOrDefaultAsync();
    }

    public static string BuildConnectionString(DBConnectionModel dbConnection)
    {
        switch (dbConnection.DbType)
        {
            case "MSSQL":
                var mssqlConnectionString = new StringBuilder($"Server={dbConnection.ServerName},{dbConnection.Port}");
                if (!string.IsNullOrEmpty(dbConnection.Instance))
                {
                    mssqlConnectionString.Append($"\\{dbConnection.Instance}");
                }
                if (dbConnection.AuthType == "Windows")
                {
                    mssqlConnectionString.Append(";Integrated Security=True;");
                }
                else
                {
                    mssqlConnectionString.Append($";User Id={dbConnection.Username};Password={dbConnection.Password};");
                }
                if (!string.IsNullOrEmpty(dbConnection.DatabaseName))
                {
                    mssqlConnectionString.Append($"Database={dbConnection.DatabaseName};");
                }
                return mssqlConnectionString.ToString();

            case "Oracle":
                if (dbConnection.AuthType == "Windows")
                {
                    return $"Data Source={dbConnection.ServerName};Integrated Security=yes;";
                }
                else if (dbConnection.AuthType == "UsernamePassword")
                {
                    return $"Data Source={dbConnection.ServerName};User Id={dbConnection.Username};Password={dbConnection.Password};Integrated Security=no;";
                }
                else if (dbConnection.AuthType == "TNSNamesOra")
                {
                    return $"Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={dbConnection.ServerName})(PORT={dbConnection.Port}))(CONNECT_DATA=(SERVICE_NAME={dbConnection.Instance})));User Id={dbConnection.Username};Password={dbConnection.Password};";
                }
                throw new ArgumentException("Unsupported Oracle authentication type.");

            case "MySQL":
                return $"server={dbConnection.ServerName};port={dbConnection.Port};database={dbConnection.DatabaseName};uid={dbConnection.Username};pwd={dbConnection.Password};";

            case "Postgres":
                return $"Host={dbConnection.ServerName};Port={dbConnection.Port};Database={dbConnection.DatabaseName};Username={dbConnection.Username};Password={dbConnection.Password};";

            /*case "MongoDB":
                var mongoStringBuilder = new StringBuilder($"mongodb://{dbConnection.Username}:{dbConnection.Password}@{dbConnection.ServerName}:{dbConnection.Port}");
                if (!string.IsNullOrEmpty(dbConnection.AuthSource))
                {
                    mongoStringBuilder.Append($"/{dbConnection.AuthSource}");
                }
                else
                {
                    mongoStringBuilder.Append("/admin");
                }

                var queryStringStarted = mongoStringBuilder.ToString().Contains("?");
                if (!string.IsNullOrEmpty(dbConnection.ReplicaSet))
                {
                    mongoStringBuilder.Append(queryStringStarted ? "&" : "?");
                    mongoStringBuilder.Append($"replicaSet={dbConnection.ReplicaSet}");
                    queryStringStarted = true;
                }

                if (dbConnection.UseTLS.HasValue && dbConnection.UseTLS.Value)
                {
                    mongoStringBuilder.Append(queryStringStarted ? "&" : "?");
                    mongoStringBuilder.Append("tls=true");
                }
                return mongoStringBuilder.ToString();*/

            case "DB2":
                return $"Server={dbConnection.ServerName}:{dbConnection.Port};Database={dbConnection.DatabaseName};UserID={dbConnection.Username};Password={dbConnection.Password};";

            default:
                throw new ArgumentException("Unsupported database type.");
        }
    }

    public (bool, string) PreviewConnection(BaseConnectionModel serverConnection)
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
                /*case "MongoDB":
                    var mongoUrlBuilder = new MongoUrlBuilder
                    {
                        Server = new MongoServerAddress(serverConnection.ServerName, serverConnection.Port),
                        Username = serverConnection.Username,
                        Password = serverConnection.Password,
                        AuthenticationSource = serverConnection.AuthSource ?? "admin",
                        ReplicaSetName = serverConnection.ReplicaSet
                    };

                    mongoUrlBuilder.UseTls = serverConnection.UseTLS.HasValue ? serverConnection.UseTLS.Value : false;
                    var mongoClientSettings = MongoClientSettings.FromUrl(mongoUrlBuilder.ToMongoUrl());

                    if (mongoUrlBuilder.UseTls)
                    {
                        mongoClientSettings.SslSettings = new SslSettings
                        {
                            EnabledSslProtocols = System.Security.Authentication.SslProtocols.Tls12
                        };
                    }

                    var mongoClient = new MongoClient(mongoClientSettings);
                    mongoClient.GetDatabase(mongoUrlBuilder.AuthenticationSource).RunCommandAsync((Command<BsonDocument>)"{ping:1}").Wait();

                    if (!string.IsNullOrEmpty(databaseName))
                    {
                        var databases = mongoClient.ListDatabases().ToList();
                        if (!databases.Any(db => db["name"] == databaseName))
                        {
                            return (false, "Database does not exist.");
                        }
                    }
                    break;*/

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

    public async Task<string> FetchSchemaNameForDB2(ObjectId connectionId, OwnerType ownerType)
    {
        var dbConnection = GetDBConnectionById(connectionId, ownerType);
        if (string.IsNullOrWhiteSpace(dbConnection.Schema))
        {
            throw new InvalidOperationException("Schema for DB2 connection is not defined.");
        }

        return dbConnection.Schema;
    }

    public List<object> FetchConnections(string ownerId, OwnerType ownerType, string connectionType)
    {
        var connections = new List<object>();

        if (connectionType == "server" || connectionType == "both")
        {
            var serverConnections = GetServerConnections(ownerId, ownerType);
            connections.AddRange(serverConnections.Select(model => new ServerConnectionDTO(model)));
        }

        if (connectionType == "database" || connectionType == "both")
        {
            var dbConnections = GetDBConnections(ownerId, ownerType);
            connections.AddRange(dbConnections.Select(model => new DBConnectionDTO(model)));
        }
        return connections;
    }

    public List<SimpleConnectionDTO> FetchConnectionsForOwner(string ownerId, string ownerTypeString, string connectionType, string ownerName = null)
    {
        var connections = new List<SimpleConnectionDTO>();
        OwnerType ownerType = (OwnerType)Enum.Parse(typeof(OwnerType), ownerTypeString, true);

        if (connectionType == "server" || connectionType == "both")
        {
            var serverConnections = GetServerConnections(ownerId, ownerType);

            connections.AddRange(serverConnections.Select(model => new SimpleConnectionDTO
            {
                Id = model.Id.ToString(),
                ServerName = model.ServerName,
                OwnerName = ownerName,
                OwnerId = ownerId,
                OwnerType = ownerType.ToString(),
                ConnectionType = "Server",
                DbType = model.DbType
            }));
        }

        if (connectionType == "database" || connectionType == "both")
        {
            var dbConnections = GetDBConnections(ownerId, ownerType);

            connections.AddRange(dbConnections.Select(model => new SimpleConnectionDTO
            {
                Id = model.Id.ToString(),
                ServerName = model.FriendlyName ?? model.DatabaseName,
                OwnerName = ownerName,
                OwnerId = ownerId,
                OwnerType = ownerType.ToString(),
                ConnectionType = "Database",
                DbType = model.DbType
            }));
        }

        return connections;
    }

    public List<BaseConnectionModel> GetServerConnections(string ownerID, OwnerType ownerType)
    {
        string collectionName = ownerType == OwnerType.Personal ? "PersonalServerConnections" : "GroupServerConnections";
        var collection = _database.GetCollection<BaseConnectionModel>(collectionName);
        var filter = Builders<BaseConnectionModel>.Filter.Eq("OwnerID", new ObjectId(ownerID));
        return collection.Find(filter).ToList();
    }

    public List<DBConnectionModel> GetDBConnections(string ownerID, OwnerType ownerType)
    {
        string collectionName = ownerType == OwnerType.Personal ? "PersonalDBConnections" : "GroupDBConnections";
        var collection = _database.GetCollection<DBConnectionModel>(collectionName);
        var filter = Builders<DBConnectionModel>.Filter.Eq("OwnerID", new ObjectId(ownerID));
        return collection.Find(filter).ToList();
    }

    public BaseConnectionModel? FetchServerConnection(List<BaseConnectionModel> serverConnections, ObjectId connectionId)
    {
        return serverConnections.FirstOrDefault(sc => sc.Id == connectionId);
    }

    public DBConnectionModel? FetchDBConnection(List<DBConnectionModel> dbConnections, ObjectId connectionId)
    {
        return dbConnections.FirstOrDefault(db => db.Id == connectionId);
    }

    public BaseConnectionModel? GetServerConnectionById(ObjectId connectionId, OwnerType ownerType)
    {
        var collection = GetServerCollection(ownerType);
        var filter = Builders<BaseConnectionModel>.Filter.Eq("_id", connectionId);
        return collection.Find(filter).FirstOrDefault();
    }

    public DBConnectionModel? GetDBConnectionById(ObjectId connectionId, OwnerType ownerType)
    {
        var collection = GetDBCollection(ownerType);
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

    public DBConnectionModel BuildDBConnectionModel(BaseConnectionModel serverConnection)
    {
        DBConnectionModel dbConnection = new DBConnectionModel();
        dbConnection.DbType = serverConnection.DbType;
        dbConnection.Username = serverConnection.Username;
        dbConnection.Password = serverConnection.Password;
        return dbConnection;
    }

    public bool AreConnectionsEqual(BaseConnectionModel connection1, BaseConnectionModel connection2)
    {
        return connection1.ServerName == connection2.ServerName &&
               connection1.Port == connection2.Port &&
               connection1.Instance == connection2.Instance &&
               connection1.DbType == connection2.DbType &&
               connection1.Username == connection2.Username &&
               connection1._encryptedPassword == connection2._encryptedPassword &&
               connection1.AuthType == connection2.AuthType &&
               connection1.OwnerID == connection2.OwnerID &&
               connection1.OwnerType == connection2.OwnerType;
    }

    public bool AreDBConnectionsEqual(DBConnectionModel connection1, DBConnectionModel connection2)
    {
        return connection1.ServerName == connection2.ServerName &&
               connection1.Port == connection2.Port &&
               connection1.Instance == connection2.Instance &&
               connection1.DbType == connection2.DbType &&
               connection1.Username == connection2.Username &&
               connection1._encryptedPassword == connection2._encryptedPassword &&
               connection1.AuthType == connection2.AuthType &&
               connection1.OwnerID == connection2.OwnerID &&
               connection1.OwnerType == connection2.OwnerType &&
               connection1.DatabaseName == connection2.DatabaseName &&
               connection1.FriendlyName == connection2.FriendlyName &&
               connection1.Schema == connection2.Schema;
    }

    public bool UpdateServerConnection(BaseConnectionModel updatedServer)
    {
        var collection = GetServerCollection(updatedServer.OwnerType);
        var result = collection.ReplaceOne(x => x.Id == updatedServer.Id, updatedServer);
        return result.IsAcknowledged && result.ModifiedCount > 0;
    }

    public bool UpdateDBConnection(DBConnectionModel updatedDB)
    {
        var collection = GetDBCollection(updatedDB.OwnerType);
        var result = collection.ReplaceOne(x => x.Id == updatedDB.Id, updatedDB);
        return result.IsAcknowledged && result.ModifiedCount > 0;
    }

    public async Task DeleteBuiltConnectionString(ObjectId builtConnectionStringId)
    {
        var collection = _database.GetCollection<BuiltConnectionString>("ConnectionStrings");
        var filter = Builders<BuiltConnectionString>.Filter.Eq(x => x.ConnectionId, builtConnectionStringId);
        await collection.DeleteOneAsync(filter);
    }
}
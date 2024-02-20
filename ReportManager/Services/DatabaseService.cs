using System;
using System.Collections.Generic;
using MongoDB.Driver;
using Oracle.ManagedDataAccess.Client;
using MySql.Data.MySqlClient;
using System.Data.SqlClient;
using Npgsql;
using IBM.Data.DB2.Core;
using System.Linq;
using MongoDB.Bson;
using ReportManager.Services;
using ReportManager.Models;

public class DatabaseService
{
    private readonly IMongoDatabase _database;
    private readonly ConnectionService _connectionService;
    private readonly SharedService _sharedService;
    private DBConnectionModel _dbConnection;
    private string _connectionString;

    public DatabaseService(ConnectionService connectionService, SharedService sharedService)
    {
        _connectionService = connectionService;
        _sharedService = sharedService;
    }

    public void SetDBConnection(string dbConnectionId, string ownerType)
    {
        ObjectId objDbConnectionId = _sharedService.StringToObjectId(dbConnectionId);
        OwnerType _ownerType = (OwnerType)Enum.Parse(typeof(OwnerType), ownerType);
        _dbConnection = _connectionService.GetDBConnectionById(objDbConnectionId, _ownerType);
        if (_dbConnection == null)
        {
            throw new InvalidOperationException("DB connection not found.");
        }
        _connectionString = ConnectionService.BuildConnectionString(_dbConnection);
    }


    public List<string> GetAllTables()
    {
        if (string.IsNullOrEmpty(_connectionString))
        {
            throw new InvalidOperationException("Connection string is not set.");
        }
        string databaseName = _dbConnection.DatabaseName;
        switch (_dbConnection.DbType.ToLower())
        {
            case "mssql":
                return GetAllTablesMsSql(_connectionString);
            case "oracle":
                return GetAllTablesOracle(_connectionString);
            case "mysql":
                return GetAllTablesMySql(_connectionString);
            case "postgresql":
                return GetAllTablesNpgsql(_connectionString);
            case "db2":
                return GetAllTablesDb2(_connectionString);
            case "mongodb":
                return GetAllTablesMongoDB(_connectionString);
            default:
                throw new NotSupportedException($"{_dbConnection.DbType} is not supported.");
        }
    }

    public List<string> GetAllColumns(string tableName)
    {
        switch (_dbConnection.DbType.ToLower())
        {
            case "mssql":
                return GetAllColumnsMsSql(_connectionString, tableName);
            case "oracle":
                return GetAllColumnsOracle(_connectionString, tableName);
            case "mysql":
                return GetAllColumnsMySql(_connectionString, tableName);
            case "postgresql":
                return GetAllColumnsNpgsql(_connectionString, tableName);
            case "db2":
                return GetAllColumnsDb2(_connectionString, tableName, _dbConnection.Schema);
            case "mongodb":
                return GetAllColumnsMongoDB(_connectionString, tableName);
            default:
                throw new NotSupportedException($"{_dbConnection.DbType} is not supported.");
        }
    }

    private List<string> GetAllTablesMsSql(string connectionString)
    {
        var tables = new List<string>();
        using (var connection = new SqlConnection(connectionString))
        {
            connection.Open();
            var command = new SqlCommand("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'", connection);
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    tables.Add(reader.GetString(0));
                }
            }
        }
        return tables;
    }

    private List<string> GetAllTablesOracle(string connectionString)
    {
        var tables = new List<string>();
        using (var connection = new OracleConnection(connectionString))
        {
            connection.Open();
            var command = new OracleCommand("SELECT TABLE_NAME FROM USER_TABLES", connection);
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    tables.Add(reader.GetString(0));
                }
            }
        }
        return tables;
    }

    private List<string> GetAllTablesMySql(string connectionString)
    {
        var tables = new List<string>();
        using (var connection = new MySqlConnection(connectionString))
        {
            connection.Open();
            var command = new MySqlCommand("SHOW TABLES", connection);
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    tables.Add(reader.GetString(0));
                }
            }
        }
        return tables;
    }

    private List<string> GetAllTablesNpgsql(string connectionString)
    {
        var tables = new List<string>();
        using (var connection = new NpgsqlConnection(connectionString))
        {
            connection.Open();
            var command = new NpgsqlCommand("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", connection);
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    tables.Add(reader.GetString(0));
                }
            }
        }
        return tables;
    }

    private List<string> GetAllTablesDb2(string connectionString)
    {
        var tables = new List<string>();
        using (var connection = new DB2Connection(connectionString))
        {
            connection.Open();
            var command = new DB2Command("SELECT NAME FROM SYSIBM.SYSTABLES WHERE TYPE = 'T'", connection);
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    tables.Add(reader.GetString(0));
                }
            }
        }
        return tables;
    }

    private List<string> GetAllTablesMongoDB(string connectionString)
    {
        var mongoUrl = new MongoUrl(connectionString);
        var databaseName = mongoUrl.DatabaseName;

        var tables = new List<string>();
        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);

        foreach (var collection in database.ListCollectionsAsync().Result.ToListAsync().Result)
        {
            tables.Add(collection["name"].AsString);
        }

        return tables;
    }

    private List<string> GetAllColumnsMsSql(string connectionString, string tableName)
    {
        var columns = new List<string>();
        using (var connection = new SqlConnection(connectionString))
        {
            connection.Open();
            var query = $"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{tableName}'";
            using (var command = new SqlCommand(query, connection))
            {
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        columns.Add(reader.GetString(0));
                    }
                }
            }
        }
        return columns;
    }

    private List<string> GetAllColumnsOracle(string connectionString, string tableName)
    {
        var columns = new List<string>();
        using (var connection = new OracleConnection(connectionString))
        {
            connection.Open();
            var query = $"SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = '{tableName.ToUpper()}'";
            using (var command = new OracleCommand(query, connection))
            {
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        columns.Add(reader.GetString(0));
                    }
                }
            }
        }
        return columns;
    }

    private List<string> GetAllColumnsMySql(string connectionString, string tableName)
    {
        var columns = new List<string>();
        using (var connection = new MySqlConnection(connectionString))
        {
            connection.Open();
            var query = $"SHOW COLUMNS FROM `{tableName}`";
            using (var command = new MySqlCommand(query, connection))
            {
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        columns.Add(reader.GetString(0));
                    }
                }
            }
        }
        return columns;
    }

    private List<string> GetAllColumnsNpgsql(string connectionString, string tableName)
    {
        var columns = new List<string>();
        using (var connection = new NpgsqlConnection(connectionString))
        {
            connection.Open();
            var query = $"SELECT column_name FROM information_schema.columns WHERE table_name = '{tableName}'";
            using (var command = new NpgsqlCommand(query, connection))
            {
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        columns.Add(reader.GetString(0));
                    }
                }
            }
        }
        return columns;
    }

    public List<string> GetAllColumnsDb2(string connectionString, string tableName, string schemaName)
    {
        var columns = new List<string>();
        using (var connection = new DB2Connection(connectionString))
        {
            connection.Open();
            var query = $"SELECT COLNAME FROM SYSCAT.COLUMNS WHERE TABNAME = '{tableName.ToUpper()}' AND TABSCHEMA = '{schemaName.ToUpper()}' ORDER BY COLNO";

            using (var command = new DB2Command(query, connection))
            {
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        columns.Add(reader.GetString(0));
                    }
                }
            }
        }
        return columns;
    }

    private List<string> GetAllColumnsMongoDB(string connectionString, string collectionName)
    {
        var mongoUrl = new MongoUrl(connectionString);
        var databaseName = mongoUrl.DatabaseName;

        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);
        var collection = database.GetCollection<BsonDocument>(collectionName);
        var document = collection.Find(new BsonDocument()).FirstOrDefault();
        if (document == null) return new List<string>();

        var columns = document.Elements.Select(element => element.Name).ToList();
        return columns;
    }
}
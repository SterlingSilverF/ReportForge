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
using System.Data;
using MySqlX.XDevAPI;
using Microsoft.Extensions.Options;
using ReportManager.Models.SettingsModels;
using System.Data.Common;

public class DatabaseService
{
    private MongoClient _client;
    private readonly IMongoDatabase _database;
    private readonly ConnectionService _connectionService;
    private readonly SharedService _sharedService;

    public class ColumnDetail
    {
        public string ColumnName { get; set; }
        public string DataType { get; set; }
    }

    public DatabaseService(ConnectionService connectionService, SharedService sharedService, IOptions<ConnectionSettings> settings)
    {
        _connectionService = connectionService;
        _sharedService = sharedService;
        _client = new MongoClient(settings.Value.MongoConnectionString);
        _database = _client.GetDatabase(settings.Value.MongoDbName);
    }

    public async Task<bool> SetupDBConnection(string dbConnectionId, string ownerType)
    {
        try
        {
            ObjectId objDbConnectionId = _sharedService.StringToObjectId(dbConnectionId);
            OwnerType _ownerType = (OwnerType)Enum.Parse(typeof(OwnerType), ownerType);
            DBConnectionModel dbConnection = _connectionService.GetDBConnectionById(objDbConnectionId, _ownerType);
            if (dbConnection == null)
            {
                throw new InvalidOperationException("DB connection not found.");
            }

            string plainConnectionString = ConnectionService.BuildConnectionString(dbConnection);
            var builtConnectionString = _database.GetCollection<BuiltConnectionString>("ConnectionStrings")
                                                        .Find(x => x.ConnectionId == objDbConnectionId)
                                                        .FirstOrDefault();
            if (builtConnectionString == null)
            {
                throw new InvalidOperationException("BuiltConnectionString document not found.");
            }

            builtConnectionString.SetEncryptedConnectionString(plainConnectionString);
            var updateDefinition = Builders<BuiltConnectionString>.Update
                                    .Set(x => x.EncryptedConnectionString, builtConnectionString.EncryptedConnectionString);
            await _database.GetCollection<BuiltConnectionString>("ConnectionStrings")
                           .UpdateOneAsync(x => x.Id == builtConnectionString.Id, updateDefinition);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<List<string>> GetAllTables(string connectionId, string dbType)
    {
        ObjectId objConnectionId = _sharedService.StringToObjectId(connectionId);
        string decryptedConnectionString = await _connectionService.FetchAndDecryptConnectionString(objConnectionId);

        switch (dbType.ToLower())
        {
            case "mssql":
                return await GetAllTablesMsSql(decryptedConnectionString);
            case "oracle":
                return await GetAllTablesOracle(decryptedConnectionString);
            case "mysql":
                return await GetAllTablesMySql(decryptedConnectionString);
            case "postgresql":
                return await GetAllTablesNpgsql(decryptedConnectionString);
            case "db2":
                return await GetAllTablesDb2(decryptedConnectionString);
            // case "mongodb":
            //     return await GetAllTablesMongoDB(decryptedConnectionString);
            default:
                throw new NotSupportedException($"{dbType} is not supported.");
        }
    }

    public async Task<List<string>> GetAllColumns(string connectionId, string dbType, string tableName, string ?ownerType = null)
    {
        ObjectId objConnectionId = _sharedService.StringToObjectId(connectionId);
        string decryptedConnectionString = await _connectionService.FetchAndDecryptConnectionString(objConnectionId);
        OwnerType _ownerType = (OwnerType)Enum.Parse(typeof(OwnerType), ownerType);
        switch (dbType.ToLower())
        {
            case "mssql":
                return await GetAllColumnsMsSql(decryptedConnectionString, tableName);
            case "oracle":
                return await GetAllColumnsOracle(decryptedConnectionString, tableName);
            case "mysql":
                return await GetAllColumnsMySql(decryptedConnectionString, tableName);
            case "postgresql":
                return await GetAllColumnsNpgsql(decryptedConnectionString, tableName);
            case "db2":
                
                string schemaName = await _connectionService.FetchSchemaNameForDB2(objConnectionId, _ownerType);
                return await GetAllColumnsDb2(decryptedConnectionString, tableName, schemaName);
            // case "mongodb":
            //     return await GetAllColumnsMongoDB(decryptedConnectionString, tableName);
            default:
                throw new NotSupportedException($"{dbType} is not supported.");
        }
    }

    public async Task<List<ColumnDetail>> GetAllColumnsWithDT(string connectionId, string dbType, string tableName, string ?ownerType = null)
    {
        ObjectId objConnectionId = _sharedService.StringToObjectId(connectionId);
        string decryptedConnectionString = await _connectionService.FetchAndDecryptConnectionString(objConnectionId);
        OwnerType _ownerType = ownerType != null ? (OwnerType)Enum.Parse(typeof(OwnerType), ownerType) : default(OwnerType);

        switch (dbType.ToLower())
        {
            case "mssql":
                return await GetAllColumnsMsSqlDT(decryptedConnectionString, tableName);
            case "oracle":
                return await GetAllColumnsOracleDT(decryptedConnectionString, tableName);
            case "mysql":
                return await GetAllColumnsMySqlDT(decryptedConnectionString, tableName);
            case "postgresql":
                return await GetAllColumnsNpgsqlDT(decryptedConnectionString, tableName);
            case "db2":
                string schemaName = await _connectionService.FetchSchemaNameForDB2(objConnectionId, _ownerType);
                return await GetAllColumnsDb2DT(decryptedConnectionString, tableName, schemaName);
            // case "mongodb":
            //     return await GetAllColumnsMongoDBDT(decryptedConnectionString, tableName);
            default:
                throw new NotSupportedException($"{dbType} is not supported.");
        }
    }

    private async Task<List<string>> GetAllTablesMsSql(string connectionString)
    {
        var tables = new List<string>();
        using (var connection = new SqlConnection(connectionString))
        {
            await connection.OpenAsync();
            var command = new SqlCommand("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'", connection);
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tables.Add(reader.GetString(0));
                }
            }
        }
        return tables;
    }

    private async Task<List<string>> GetAllTablesOracle(string connectionString)
    {
        var tables = new List<string>();
        using (var connection = new OracleConnection(connectionString))
        {
            await connection.OpenAsync();
            var command = new OracleCommand("SELECT TABLE_NAME FROM USER_TABLES", connection);
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tables.Add(reader.GetString(0));
                }
            }
        }
        return tables;
    }

    private async Task<List<string>> GetAllTablesMySql(string connectionString)
    {
        var tables = new List<string>();
        using (var connection = new MySqlConnection(connectionString))
        {
            await connection.OpenAsync();
            var command = new MySqlCommand("SHOW TABLES", connection);
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tables.Add(reader.GetString(0));
                }
            }
        }
        return tables;
    }

    private async Task<List<string>> GetAllTablesNpgsql(string connectionString)
    {
        var tables = new List<string>();
        using (var connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();
            var command = new NpgsqlCommand("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", connection);
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tables.Add(reader.GetString(0));
                }
            }
        }
        return tables;
    }

    private async Task<List<string>> GetAllTablesDb2(string connectionString)
    {
        var tables = new List<string>();
        using (var connection = new DB2Connection(connectionString))
        {
            await connection.OpenAsync();
            var command = new DB2Command("SELECT NAME FROM SYSIBM.SYSTABLES WHERE TYPE = 'T'", connection);
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tables.Add(reader.GetString(0));
                }
            }
        }
        return tables;
    }

    private async Task<List<BsonValue>> GetAllTablesMongoDB(string connectionString, string databaseName, string collectionName)
    {
        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);
        var collection = database.GetCollection<BsonDocument>(collectionName);

        var documentIds = await collection.Find(new BsonDocument())
                                          .Project(Builders<BsonDocument>.Projection.Include("_id"))
                                          .ToListAsync()
                                          .ContinueWith(task => task.Result.Select(doc => doc["_id"]).ToList());

        return documentIds;
    }

    private async Task<List<string>> GetAllColumnsMsSql(string connectionString, string tableName)
    {
        var columns = new List<string>();
        using (var connection = new SqlConnection(connectionString))
        {
            await connection.OpenAsync();
            var query = $"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{tableName}'";
            using (var command = new SqlCommand(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        columns.Add(reader.GetString(0));
                    }
                }
            }
        }
        return columns;
    }

    private async Task<List<ColumnDetail>> GetAllColumnsMsSqlDT(string connectionString, string tableName)
    {
        var columns = new List<ColumnDetail>();
        using (var connection = new SqlConnection(connectionString))
        {
            await connection.OpenAsync();
            var query = $"SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{tableName}'";
            using (var command = new SqlCommand(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        columns.Add(new ColumnDetail
                        {
                            ColumnName = reader.GetString(0),
                            DataType = reader.GetString(1)
                        });
                    }
                }
            }
        }
        return columns;
    }

    private async Task<List<string>> GetAllColumnsOracle(string connectionString, string tableName)
    {
        var columns = new List<string>();
        using (var connection = new OracleConnection(connectionString))
        {
            await connection.OpenAsync();
            var query = $"SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = '{tableName.ToUpper()}'";
            using (var command = new OracleCommand(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        columns.Add(reader.GetString(0));
                    }
                }
            }
        }
        return columns;
    }

    private async Task<List<ColumnDetail>> GetAllColumnsOracleDT(string connectionString, string tableName)
    {
        var columns = new List<ColumnDetail>();
        using (var connection = new OracleConnection(connectionString))
        {
            await connection.OpenAsync();
            var query = $"SELECT COLUMN_NAME, DATA_TYPE FROM USER_TAB_COLUMNS WHERE TABLE_NAME = '{tableName.ToUpper()}'";
            using (var command = new OracleCommand(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        columns.Add(new ColumnDetail
                        {
                            ColumnName = reader.GetString(0),
                            DataType = reader.GetString(1)
                        });
                    }
                }
            }
        }
        return columns;
    }

    private async Task<List<string>> GetAllColumnsMySql(string connectionString, string tableName)
    {
        var columns = new List<string>();
        using (var connection = new MySqlConnection(connectionString))
        {
            await connection.OpenAsync();
            var query = $"SHOW COLUMNS FROM `{tableName}`";
            using (var command = new MySqlCommand(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        columns.Add(reader.GetString(0));
                    }
                }
            }
        }
        return columns;
    }

    private async Task<List<ColumnDetail>> GetAllColumnsMySqlDT(string connectionString, string tableName)
    {
        var columns = new List<ColumnDetail>();
        using (var connection = new MySqlConnection(connectionString))
        {
            await connection.OpenAsync();
            var query = $"SHOW COLUMNS FROM `{tableName}`";
            using (var command = new MySqlCommand(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        columns.Add(new ColumnDetail
                        {
                            ColumnName = reader.GetString("Field"),
                            DataType = reader.GetString("Type")
                        });
                    }
                }
            }
        }
        return columns;
    }

    private async Task<List<string>> GetAllColumnsNpgsql(string connectionString, string tableName)
    {
        var columns = new List<string>();
        using (var connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();
            var query = $"SELECT column_name FROM information_schema.columns WHERE table_name = '{tableName}' AND table_schema = 'public'";
            using (var command = new NpgsqlCommand(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        columns.Add(reader.GetString(0));
                    }
                }
            }
        }
        return columns;
    }

    private async Task<List<ColumnDetail>> GetAllColumnsNpgsqlDT(string connectionString, string tableName)
    {
        var columns = new List<ColumnDetail>();
        using (var connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();
            var query = $"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{tableName}' AND table_schema = 'public'";
            using (var command = new NpgsqlCommand(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        columns.Add(new ColumnDetail
                        {
                            ColumnName = reader.GetString(0),
                            DataType = reader.GetString(1)
                        });
                    }
                }
            }
        }
        return columns;
    }

    // TODO: Require schema when DB2
    private async Task<List<string>> GetAllColumnsDb2(string connectionString, string tableName, string schemaName)
    {
        var columns = new List<string>();
        using (var connection = new DB2Connection(connectionString))
        {
            await connection.OpenAsync();
            var query = $"SELECT COLNAME FROM SYSCAT.COLUMNS WHERE TABNAME = '{tableName.ToUpper()}' AND TABSCHEMA = '{schemaName.ToUpper()}' ORDER BY COLNO";
            using (var command = new DB2Command(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        columns.Add(reader.GetString(0));
                    }
                }
            }
        }
        return columns;
    }

    private async Task<List<ColumnDetail>> GetAllColumnsDb2DT(string connectionString, string tableName, string schemaName)
    {
        var columns = new List<ColumnDetail>();
        using (var connection = new DB2Connection(connectionString))
        {
            await connection.OpenAsync();
            var query = $"SELECT COLNAME, TYPENAME FROM SYSCAT.COLUMNS WHERE TABNAME = '{tableName.ToUpper()}' AND TABSCHEMA = '{schemaName.ToUpper()}' ORDER BY COLNO";
            using (var command = new DB2Command(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        columns.Add(new ColumnDetail
                        {
                            ColumnName = reader.GetString(0),
                            DataType = reader.GetString(1)
                        });
                    }
                }
            }
        }
        return columns;
    }

    private async Task<List<string>> GetAllColumnsMongoDB(string connectionString, string databaseName, string collectionName, BsonValue documentId)
    {
        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);
        var collection = database.GetCollection<BsonDocument>(collectionName);

        var document = await collection.Find(Builders<BsonDocument>.Filter.Eq("_id", documentId)).FirstOrDefaultAsync();
        return document?.Elements.Select(e => e.Name).ToList() ?? new List<string>();
    }

    private async Task<List<ColumnDetail>> GetAllColumnsMongoDBDT(string connectionString, string databaseName, string collectionName, BsonValue documentId)
    {
        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);
        var collection = database.GetCollection<BsonDocument>(collectionName);

        var document = await collection.Find(Builders<BsonDocument>.Filter.Eq("_id", documentId)).FirstOrDefaultAsync();
        if (document == null) return new List<ColumnDetail>();

        var columnDetails = document.Elements.Select(e => new ColumnDetail
        {
            ColumnName = e.Name,
            DataType = e.Value.BsonType.ToString()
        }).ToList();

        return columnDetails;
    }

    public static bool SqlSanitizationChecks(string sqlStatement, bool isReadOnly = true)
    {
        var forbiddenCharacters = new[] { ";", "--", "/*", "*/", "@@", "@" };
        var alwaysForbiddenKeywords = new[] { "CURSOR", "KILL", "SYS", "SYSTABLES", "SYSOBJECTS", "SYSVIEWS", "SYSUSERS" };
        var conditionalForbiddenKeywords = isReadOnly ? new string[] { } : new[] { "ALTER", "BEGIN", "CREATE", "DELETE", "DROP", "END", "EXEC", "EXECUTE", "INSERT", "UPDATE" };


        foreach (var charPattern in forbiddenCharacters)
        {
            if (sqlStatement.Contains(charPattern)) return false;
        }

        foreach (var kw in alwaysForbiddenKeywords)
        {
            if (sqlStatement.IndexOf(kw, StringComparison.OrdinalIgnoreCase) >= 0) return false;
        }

        foreach (var kw in conditionalForbiddenKeywords)
        {
            if (sqlStatement.IndexOf(kw, StringComparison.OrdinalIgnoreCase) >= 0) return false;
        }

        if (isReadOnly)
        {
            var disallowedPostEqualsKeywords = new[] { "DELETE", "DROP", "CREATE", "UPDATE" };
            var substringsAfterEquals = sqlStatement.Split(new[] { '=' }, StringSplitOptions.RemoveEmptyEntries).Skip(1);

            foreach (var substring in substringsAfterEquals)
            {
                foreach (var kw in disallowedPostEqualsKeywords)
                {
                    if (substring.IndexOf(kw, StringComparison.OrdinalIgnoreCase) >= 0) return false;
                }
            }
        }

        return true;
    }

    public async Task<dynamic> ExecuteSanitizedQuery(string dbType, string connectionString, string SQL)
    {
        bool safe = SqlSanitizationChecks(SQL);
        if (!safe)
        {
            throw new InvalidOperationException("SQL safety verification failed.");
        }

        return await ExecuteQueryAsync(dbType, connectionString, SQL);
    }

    public async Task<List<Dictionary<string, object>>> ExecuteQueryAsync(string dbType, string connectionString, string query)
    {
        var results = new List<Dictionary<string, object>>();
        try
        {
            // No this is not DBConnectionModel
            using (DbConnection connection = dbType.ToLower() switch
            {
                "mssql" => new SqlConnection(connectionString) as DbConnection,
                "oracle" => new OracleConnection(connectionString) as DbConnection,
                "mysql" => new MySqlConnection(connectionString) as DbConnection,
                "postgresql" => new NpgsqlConnection(connectionString) as DbConnection,
                "db2" => new DB2Connection(connectionString) as DbConnection,
                _ => throw new ArgumentException("Unsupported database type", nameof(dbType)),
            })
            {
                await connection.OpenAsync();
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = query;
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var row = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                row.Add(reader.GetName(i), reader.GetValue(i));
                            }
                            results.Add(row);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"{dbType} query execution error: {ex.Message}");
        }
        return results;
    }
}
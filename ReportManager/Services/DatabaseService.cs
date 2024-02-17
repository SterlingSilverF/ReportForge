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

public class ReportService
{
    private readonly IMongoDatabase _database;

    public ReportService(string mongoConnectionString, string mongoDbName)
    {
        var client = new MongoClient(mongoConnectionString);
        _database = client.GetDatabase(mongoDbName);
    }

    public List<string> GetAllTables(string databaseType, string databaseName)
    {
        switch (databaseType.ToLower())
        {
            case "mssql":
                return GetAllTablesMsSql(databaseName);
            case "oracle":
                return GetAllTablesOracle(databaseName);
            case "mysql":
                return GetAllTablesMySql(databaseName);
            case "postgresql":
                return GetAllTablesNpgsql(databaseName);
            case "db2":
                return GetAllTablesDb2(databaseName);
            case "mongodb":
                return GetAllTablesMongoDB(databaseName);
            default:
                throw new NotSupportedException($"{databaseType} is not supported.");
        }
    }

    private List<string> GetAllTablesMsSql(string databaseName)
    {
        var tables = new List<string>();
        var connectionString = ""; // Set your MSSQL connection string here
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

    private List<string> GetAllTablesOracle(string databaseName)
    {
        var tables = new List<string>();
        var connectionString = ""; // Set your Oracle connection string here
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

    private List<string> GetAllTablesMySql(string databaseName)
    {
        var tables = new List<string>();
        var connectionString = ""; // Set your MySQL connection string here
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

    private List<string> GetAllTablesNpgsql(string databaseName)
    {
        var tables = new List<string>();
        var connectionString = ""; // Set your PostgreSQL connection string here
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

    private List<string> GetAllTablesDb2(string databaseName)
    {
        var tables = new List<string>();
        var connectionString = ""; // Set your DB2 connection string here
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

    private List<string> GetAllTablesMongoDB(string databaseName)
    {
        var tables = new List<string>();
        var client = new MongoClient(); // Use the MongoClient instance already created if applicable
        var database = client.GetDatabase(databaseName);

        foreach (var collection in database.ListCollectionsAsync().Result.ToListAsync().Result)
        {
            tables.Add(collection["name"].AsString);
        }

        return tables;
    }
}
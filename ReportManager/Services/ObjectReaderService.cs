using Dapper;
using System.Data.SqlClient;
using Oracle.ManagedDataAccess.Client;
using MySql.Data.MySqlClient;
using Npgsql;
using MongoDB.Driver;
using System.Data;
using ReportManager.Models;
using System.Collections.Generic;
using MongoDB.Bson;

[Flags]
public enum DBObjectType
{
    None = 0,
    Table = 1,
    View = 2,
    Procedure = 4,
    All = Table | View | Procedure
}
/*
public interface IObjectReaderService
{
    List<DatabaseObjectInfoModel> GetObjectStructure(DBConnectionModel DBConnection, DBObjectType objectType = DBObjectType.All);
    IEnumerable<dynamic> ReadData(DBConnectionModel DBConnection, string objectName);
}

public class ObjectReaderService : IObjectReaderService
{
    private readonly ConnectionService _connectionService;

    public ObjectReaderService(ConnectionService connectionService)
    {
        _connectionService = connectionService;
    }

    public List<DatabaseObjectInfoModel> GetObjectStructure(DBConnectionModel DBConnection, DBObjectType objectType = DBObjectType.All)
    {
        List<DatabaseObjectInfoModel> objects = new List<DatabaseObjectInfoModel>();
        IDbConnection dbConnection;

        switch (DBConnection.DbType)
        {
            case "MSSQL":
                dbConnection = new SqlConnection(ConnectionService.BuildConnectionString(DBConnection));

                if (objectType.HasFlag(DBObjectType.Table))
                {
                    var mssqlTables = dbConnection.Query<DatabaseObjectInfoModel>("SELECT TABLE_NAME as ObjName, 'Table' as ObjType FROM INFORMATION_SCHEMA.TABLES");
                    objects.AddRange(mssqlTables);
                }

                if (objectType.HasFlag(DBObjectType.View))
                {
                    var mssqlViews = dbConnection.Query<DatabaseObjectInfoModel>("SELECT TABLE_NAME as ObjName, 'View' as ObjType FROM INFORMATION_SCHEMA.VIEWS");
                    objects.AddRange(mssqlViews);
                }

                if (objectType.HasFlag(DBObjectType.Procedure))
                {
                    var mssqlProcedures = dbConnection.Query<DatabaseObjectInfoModel>("SELECT NAME as ObjName, 'Procedure' as ObjType FROM sys.procedures");
                    objects.AddRange(mssqlProcedures);
                }
                break;

            case "Oracle":
                dbConnection = new OracleConnection(ConnectionService.BuildConnectionString(DBConnection));

                if (objectType.HasFlag(DBObjectType.Table))
                {
                    var oracleTables = dbConnection.Query<DatabaseObjectInfoModel>("SELECT TABLE_NAME as ObjName, 'Table' as ObjType FROM USER_TABLES");
                    objects.AddRange(oracleTables);
                }

                if (objectType.HasFlag(DBObjectType.View))
                {
                    var oracleViews = dbConnection.Query<DatabaseObjectInfoModel>("SELECT VIEW_NAME as ObjName, 'View' as ObjType FROM USER_VIEWS");
                    objects.AddRange(oracleViews);
                }

                if (objectType.HasFlag(DBObjectType.Procedure))
                {
                    var oracleProcedures = dbConnection.Query<DatabaseObjectInfoModel>("SELECT OBJECT_NAME as ObjName, 'Procedure' as ObjType FROM USER_PROCEDURES WHERE OBJECT_TYPE = 'PROCEDURE'");
                    objects.AddRange(oracleProcedures);
                }
                break;

            case "MySQL":
                dbConnection = new MySqlConnection(ConnectionService.BuildConnectionString(DBConnection));

                if (objectType.HasFlag(DBObjectType.Table))
                {
                    var mySqlTables = dbConnection.Query<DatabaseObjectInfoModel>("SHOW TABLES;");
                    objects.AddRange(mySqlTables.Select(t => new DatabaseObjectInfoModel { ObjName = t.ObjName, ObjType = ObjectType.Table }));
                }

                if (objectType.HasFlag(DBObjectType.View))
                {
                    var mySqlViews = dbConnection.Query<DatabaseObjectInfoModel>("SELECT TABLE_NAME as ObjName, 'View' as ObjType FROM information_schema.VIEWS WHERE TABLE_SCHEMA = @DatabaseName", new { DatabaseName = DBConnection.DatabaseName });
                    objects.AddRange(mySqlViews);
                }

                if (objectType.HasFlag(DBObjectType.Procedure))
                {
                    var mySqlProcedures = dbConnection.Query<DatabaseObjectInfoModel>("SELECT ROUTINE_NAME as ObjName, 'Procedure' as ObjType FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = @DatabaseName AND ROUTINE_TYPE = 'PROCEDURE'", new { DatabaseName = DBConnection.DatabaseName });
                    objects.AddRange(mySqlProcedures);
                }
                break;

            case "Postgres":
                dbConnection = new NpgsqlConnection(ConnectionService.BuildConnectionString(DBConnection));

                if (objectType.HasFlag(DBObjectType.Table))
                {
                    var postgresTables = dbConnection.Query<DatabaseObjectInfoModel>("SELECT table_name as ObjName, 'Table' as ObjType FROM information_schema.tables WHERE table_schema = 'public';");
                    objects.AddRange(postgresTables);
                }

                if (objectType.HasFlag(DBObjectType.View))
                {
                    var postgresViews = dbConnection.Query<DatabaseObjectInfoModel>("SELECT table_name as ObjName, 'View' as ObjType FROM information_schema.views WHERE table_schema = 'public';");
                    objects.AddRange(postgresViews);
                }

                if (objectType.HasFlag(DBObjectType.Procedure))
                {
                    var postgresProcedures = dbConnection.Query<DatabaseObjectInfoModel>("SELECT routine_name as ObjName, 'Procedure' as ObjType FROM information_schema.routines WHERE routine_schema = 'public';");
                    objects.AddRange(postgresProcedures);
                }
                break;

            case "MongoDB":
                // MongoDB views are not the same as views in other databases, but we still allow users to retrieve them
                // Using table flag to represent MongoDB collection
                var mongoClient = new MongoClient(ConnectionService.BuildConnectionString(DBConnection));
                var db = mongoClient.GetDatabase(DBConnection.Instance);
                var collections = db.ListCollections().ToList();

                foreach (var collection in collections)
                {
                    BsonDocument bsonDocument = collection.ToBsonDocument();

                    if (bsonDocument.Contains("type") && bsonDocument["type"] == "view" && objectType.HasFlag(DBObjectType.View))
                    {
                        objects.Add(new DatabaseObjectInfoModel { ObjName = bsonDocument["name"].ToString(), ObjType = ObjectType.View });
                    }
                    else if (objectType.HasFlag(DBObjectType.Table))
                    {
                        objects.Add(new DatabaseObjectInfoModel { ObjName = bsonDocument["name"].ToString(), ObjType = ObjectType.Table });
                    }
                }
                break;

            default:
                throw new ArgumentException("Unsupported database type.");
        }
        return objects;
    }

    public IEnumerable<dynamic> ReadData(DBConnectionModel DBConnection, string objectName)
    {
        IDbConnection dbConnection;

        switch (DBConnection.DbType)
        {
            case "MSSQL":
                dbConnection = new SqlConnection(ConnectionService.BuildConnectionString(DBConnection));
                return dbConnection.Query($"SELECT * FROM {objectName}");

            case "Oracle":
                dbConnection = new OracleConnection(ConnectionService.BuildConnectionString(DBConnection));
                return dbConnection.Query($"SELECT * FROM {objectName}");

            case "MySQL":
                dbConnection = new MySqlConnection(ConnectionService.BuildConnectionString(DBConnection));
                return dbConnection.Query($"SELECT * FROM {objectName}");

            case "Postgres":
                dbConnection = new NpgsqlConnection(ConnectionService.BuildConnectionString(DBConnection));
                return dbConnection.Query($"SELECT * FROM {objectName}");

            case "MongoDB":
                return _connectionService.FetchDataFromMongoDB(objectName);

            default:
                throw new ArgumentException("Unsupported database type.");
        }
    }
}*/
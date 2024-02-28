using Microsoft.VisualStudio.TestTools.UnitTesting;
using ReportManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReportManagerTest
{
    [TestClass]
    public class ConnectionServiceTests
    {
        [TestMethod]
        public void BuildConnectionString_WithMSSQL()
        {
            var dbConnection = new DBConnectionModel
            {
                DbType = "MSSQL",
                ServerName = "localhost",
                Port = 1433,
                Username = "sa",
                Password = "your_password",
                DatabaseName = "TestDB",
                AuthType = "SQL"
            };
            var expectedConnectionString = "Server=localhost,1433;User Id=sa;Password=your_password;Database=TestDB;";
            string actualConnectionString = ConnectionService.BuildConnectionString(dbConnection);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(expectedConnectionString, actualConnectionString);
        }

        // MySQL
        [TestMethod]
        public void BuildConnectionString_WithMySQL()
        {
            var dbConnection = new DBConnectionModel
            {
                DbType = "MySQL",
                ServerName = "localhost",
                Port = 3306,
                Username = "root",
                Password = "your_password",
                DatabaseName = "TestDB"
            };
            var expectedConnectionString = "Server=localhost;Port=3306;User Id=root;Password=your_password;Database=TestDB;";
            string actualConnectionString = ConnectionService.BuildConnectionString(dbConnection);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(expectedConnectionString, actualConnectionString);
        }

        // PostgreSQL
        [TestMethod]
        public void BuildConnectionString_WithPostgres() 
        {
            var dbConnection = new DBConnectionModel
            {
                DbType = "Postgres",
                ServerName = "localhost",
                Port = 5432,
                Username = "postgres",
                Password = "your_password",
                DatabaseName = "TestDB"
            };
            var expectedConnectionString = "Host=localhost;Port=5432;Username=postgres;Password=your_password;Database=TestDB;";
            string actualConnectionString = ConnectionService.BuildConnectionString(dbConnection);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(expectedConnectionString, actualConnectionString);
        }

        // Oracle
        [TestMethod]
        public void BuildConnectionString_WithOracle()
        {
            var dbConnection = new DBConnectionModel
            {
                DbType = "Oracle",
                ServerName = "localhost",
                Port = 1521,
                Username = "user",
                Password = "your_password",
                DatabaseName = "TestDB"
            };
            var expectedConnectionString = "User Id=user;Password=your_password;Data Source=localhost:1521/TestDB;";
            string actualConnectionString = ConnectionService.BuildConnectionString(dbConnection);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(expectedConnectionString, actualConnectionString);
        }

        // MongoDB
        /*[TestMethod]
        public void BuildConnectionString_WithMongoDB()
        {
            var dbConnection = new DBConnectionModel
            {
                DbType = "MongoDB",
                ServerName = "localhost",
                Port = 27017,
                Username = "mongoUser",
                Password = "mongoPass",
                DatabaseName = "TestDB"
            };
            var expectedConnectionString = "mongodb://mongoUser:mongoPass@localhost:27017/TestDB";
            string actualConnectionString = ConnectionService.BuildConnectionString(dbConnection);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(expectedConnectionString, actualConnectionString);
        }*/
    }
}
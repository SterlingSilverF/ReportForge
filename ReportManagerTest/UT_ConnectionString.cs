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
        [TestInitialize]
        public void TestInitialize()
        {
            Environment.SetEnvironmentVariable("ReportManager_ENCRYPTION_KEY", "2flkCJqIvrPsNwjE4GULKarlM5nv3h6imIxefR0S0JA=");
            Environment.SetEnvironmentVariable("ReportManager_ENCRYPTION_IV", "Vfeo5SGD8S1muxsy+UKb8Q==");
        }

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
            var expectedConnectionString = "server=localhost;port=3306;database=TestDB;uid=root;pwd=your_password;";
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
            var expectedConnectionString = "Host=localhost;Port=5432;Database=TestDB;Username=postgres;Password=your_password;";
            string actualConnectionString = ConnectionService.BuildConnectionString(dbConnection);
            Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(expectedConnectionString, actualConnectionString);
        }

        // Oracle
        [TestMethod]
        public void BuildConnectionString_WithOracle_UsernamePassword()
        {
            var dbConnection = new DBConnectionModel
            {
                DbType = "Oracle",
                ServerName = "localhost",
                Username = "user",
                Password = "your_password",
                AuthType = "UsernamePassword"
            };
            var expectedConnectionString = "Data Source=localhost;User Id=user;Password=your_password;Integrated Security=no;";
            string actualConnectionString = ConnectionService.BuildConnectionString(dbConnection);
            Assert.AreEqual(expectedConnectionString, actualConnectionString);
        }

        [TestMethod]
        public void BuildConnectionString_WithOracle_TNSNamesOra()
        {
            var dbConnection = new DBConnectionModel
            {
                DbType = "Oracle",
                ServerName = "localhost",
                Port = 1521,
                Username = "user",
                Password = "your_password",
                Instance = "TestDB",
                AuthType = "TNSNamesOra"
            };
            var expectedConnectionString = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=TestDB)));User Id=user;Password=your_password;";
            string actualConnectionString = ConnectionService.BuildConnectionString(dbConnection);
            Assert.AreEqual(expectedConnectionString, actualConnectionString);
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
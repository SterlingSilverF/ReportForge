using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;

namespace ReportManagerTest
{
    [TestClass]
    public class SqlSanitizationTests
    {
        [DataTestMethod]
        [DataRow("SELECT * FROM Users WHERE UserID = 123", true, true)]
        [DataRow("SELECT * FROM Users WHERE UserID = ' OR 1=1 --", true, false)]
        [DataRow("UPDATE Users SET Name = 'John' WHERE UserID = 123", false, true)]
        [DataRow("DROP TABLE Users", false, false)]
        [DataRow("EXEC sp_executesql N'DROP DATABASE TestDB'", false, false)]
        [DataRow("SELECT * FROM sysobjects", true, false)]
        [DataRow("INSERT INTO Users (Name) VALUES ('Jane')", false, true)]
        [DataRow("DELETE FROM Users WHERE UserID = 123; SELECT * FROM Users", true, false)]
        [DataRow("SELECT * FROM Users; DROP TABLE Users", true, false)]
        [DataRow("SELECT * FROM Users WHERE Name = 'John' --DROP TABLE Users", true, false)]
        [DataRow("SELECT * FROM Users WHERE UserID = 123", false, true)]
        [DataRow("ALTER TABLE Users ADD Email VARCHAR(255)", false, false)]
        public void TestPerformSqlSanitizationChecks(string sqlStatement, bool isReadOnly, bool expectedResult)
        {
            bool result = DatabaseService.SqlSanitizationChecks(sqlStatement, isReadOnly);
            Assert.AreEqual(expectedResult, result);
        }
    }
}
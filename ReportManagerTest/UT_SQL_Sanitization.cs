using Microsoft.VisualStudio.TestTools.UnitTesting;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReportManagerTest
{
    [TestFixture]
    public class SqlSanitizationTests
    {
        [TestCase("SELECT * FROM Users WHERE UserID = 123", true, ExpectedResult = true)]
        [TestCase("SELECT * FROM Users WHERE UserID = ' OR 1=1 --", true, ExpectedResult = false)]
        [TestCase("UPDATE Users SET Name = 'John' WHERE UserID = 123", false, ExpectedResult = true)]
        [TestCase("DROP TABLE Users", false, ExpectedResult = false)]
        [TestCase("EXEC sp_executesql N'DROP DATABASE TestDB'", false, ExpectedResult = false)]
        [TestCase("SELECT * FROM sysobjects", true, ExpectedResult = false)]
        [TestCase("INSERT INTO Users (Name) VALUES ('Jane')", false, ExpectedResult = true)]
        [TestCase("DELETE FROM Users WHERE UserID = 123; SELECT * FROM Users", true, ExpectedResult = false)]
        [TestCase("SELECT * FROM Users; DROP TABLE Users", true, ExpectedResult = false)]
        [TestCase("SELECT * FROM Users WHERE Name = 'John' --DROP TABLE Users", true, ExpectedResult = false)]
        [TestCase("SELECT * FROM Users WHERE UserID = 123", false, ExpectedResult = true)] // Read-only query, but isReadOnly is false
        [TestCase("ALTER TABLE Users ADD Email VARCHAR(255)", false, ExpectedResult = false)]
        public bool TestPerformSqlSanitizationChecks(string sqlStatement, bool isReadOnly)
        {
            return DatabaseService.SqlSanitizationChecks(sqlStatement, isReadOnly);
        }
    }
}

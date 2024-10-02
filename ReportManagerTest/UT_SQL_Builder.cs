using Microsoft.Extensions.Configuration;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using ReportManager.Models;
using ReportManager.Services;
using System.Collections.Generic;
using System.IO;
using static ReportManager.API.ReportController;

namespace ReportManagerTest
{
    [TestClass]
    public class SqlQueryBuilderTests
    {
        private IConfiguration _configuration;
        private AppDatabaseService _appDatabaseService;
        private ReportManagementService _reportManagementService;

        [TestInitialize]
        public void TestInitialize()
        {
            _configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .Build();

            _appDatabaseService = new AppDatabaseService(_configuration);
            _reportManagementService = new ReportManagementService(_appDatabaseService);
        }

        [TestMethod]
        public void BuildSqlQuery_ReturnsCorrectSqlQuery()
        {
            // Arrange
            var request = new BuildSQLRequest
            {
                SelectedTables = new List<string> { "Table1", "Table2" },
                SelectedColumns = new List<BaseColumnDefinition>
                {
                    new BaseColumnDefinition { Table = "Table1", ColumnName = "Column1" },
                    new BaseColumnDefinition { Table = "Table2", ColumnName = "Column2" }
                },
                JoinConfig = new List<JoinConfigItem>
                {
                    new JoinConfigItem { TableOne = "Table1", TableTwo = "Table2", ColumnOne = "Column1", ColumnTwo = "Column2", IsValid = true }
                },
                Filters = new List<FilterItem>
                {
                    new FilterItem { Table = "Table1", Column = "Column1", Condition = "=", Value = "Value1" }
                },
                OrderBys = new List<OrderByItem>
                {
                    new OrderByItem { Table = "Table1", Column = "Column1", Direction = "ASC" }
                }
            };

            string sqlQuery = _reportManagementService.BuildSQLQuery(request);
            string expectedSqlQuery = "SELECT Table1.Column1, Table2.Column2 FROM Table1 INNER JOIN Table2 ON Table1.Column1 = Table2.Column2 WHERE Table1.Column1 = 'Value1' ORDER BY Table1.Column1 ASC";
            Assert.AreEqual(expectedSqlQuery, sqlQuery);
        }
    }
}
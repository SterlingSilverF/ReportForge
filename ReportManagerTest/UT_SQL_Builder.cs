using Microsoft.VisualStudio.TestTools.UnitTesting;
using ReportManager.Models;
using ReportManagerTest;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static ReportManager.API.ReportController;
using static ReportManager.Models.SQL_Builder;

[TestClass]
public class SqlQueryBuilderTests
{
    [TestMethod]
    public void BuildSqlQuery_ReturnsCorrectSqlQuery()
    {
        var request = new BuildSQLRequest
        {
            SelectedTables = new List<string> { "Table1", "Table2" },
            SelectedColumns = new List<ColumnDefinition>
            {
                new ColumnDefinition { Table = "Table1", ColumnName = "Column1" },
                new ColumnDefinition { Table = "Table2", ColumnName = "Column2" }
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
        PseudoSettings pseudoSettings = new PseudoSettings();
        AppDatabaseService _appDatabaseService = new AppDatabaseService(pseudoSettings.Configuration.GetSection("ConnectionSettings"));
        ReportManagementService _reportManagementService = new ReportManagementService(_appDatabaseService);
        string sqlQuery = _reportManagementService.BuildSQLQuery(request);
        string expectedSqlQuery = "SELECT Table1.Column1, Table2.Column2 FROM Table1 INNER JOIN Table2 ON Table1.Column1 = Table2.Column2 WHERE Table1.Column1 = 'Value1' ORDER BY Table1.Column1 ASC";
        Microsoft.VisualStudio.TestTools.UnitTesting.Assert.AreEqual(expectedSqlQuery, sqlQuery);
    }
}
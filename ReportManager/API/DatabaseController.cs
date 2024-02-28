using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using ReportManager.Services;
using MySqlX.XDevAPI.Relational;
using ReportManager.Models;
using MongoDB.Bson;

namespace ReportManager.API
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatabaseController : ControllerBase
    {
        private readonly DatabaseService _databaseService;
        private readonly ConnectionService _connectionService;
        private readonly SharedService _sharedService;

        public DatabaseController(DatabaseService databaseService, ConnectionService connectionService, SharedService sharedService)
        {
            _databaseService = databaseService;
            _connectionService = connectionService;
            _sharedService = sharedService;
        }

        [HttpPost("LoadDesignerPage")]
        public async Task<IActionResult> LoadDesignerPage(string connectionId, string dbType, string ownerType)
        {
            try
            {
                bool isConnectionSetupSuccessful = await _databaseService.SetupDBConnection(connectionId, ownerType, dbType);
                if (!isConnectionSetupSuccessful)
                {
                    return BadRequest("Failed to setup database connection.");
                }

                var tables = await _databaseService.GetAllTables(connectionId, dbType);
                return Ok(tables);
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred while loading the designer page: {ex.Message}");
            }
        }

        [HttpGet("GetAllColumns")]
        public async Task<ActionResult> GetAllColumns(string connectionId, string dbType, string tableName, string ownerType)
        {
            try
            {
                var columns = await _databaseService.GetAllColumns(connectionId, dbType, tableName, ownerType);
                return Ok(columns);
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred while retrieving columns for table {tableName}: {ex.Message}");
            }
        }

        [HttpGet("GetAllColumnsWithDT")]
        public async Task<ActionResult> GetAllColumnsWithDT(string connectionId, string dbType, string tableName, string ownerType)
        {
            try
            {
                var columns = await _databaseService.GetAllColumnsWithDT(connectionId, dbType, tableName, ownerType);
                return Ok(columns);
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred while retrieving columns and data types for table {tableName}: {ex.Message}");
            }
        }

        [HttpPost("HandleSql")]
        public async Task<ActionResult> HandleSQL(string dbType, string SQL, string connectionId)
        {
            bool safe = DatabaseService.SqlSanitizationChecks(SQL);
            if (safe)
            {
                ObjectId _connectionId = _sharedService.StringToObjectId(connectionId);
                string connectionstring = await _connectionService.FetchAndDecryptConnectionString(_connectionId);
                var result = await _databaseService.ExecuteQueryAsync(dbType, connectionstring, SQL);
                return Ok(result);
            }
            else
            {
                return BadRequest("SQL safety verification failed.");
            }
        }
    }
}
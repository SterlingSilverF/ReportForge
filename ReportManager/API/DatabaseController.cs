using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using ReportManager.Services;
using MySqlX.XDevAPI.Relational;
using ReportManager.Models;

namespace ReportManager.API
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatabaseController : ControllerBase
    {
        private readonly DatabaseService _databaseService;

        public DatabaseController(DatabaseService databaseService)
        {
            _databaseService = databaseService;
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
    }
}
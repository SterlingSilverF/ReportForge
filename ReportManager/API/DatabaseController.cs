using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using ReportManager.Services;
using MySqlX.XDevAPI.Relational;

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

        [HttpPost("SetConnection")]
        public ActionResult SetConnection(string connectionId, string ownerType)
        {
            try
            {
                _databaseService.SetDBConnection(connectionId, ownerType);
                return Ok("Connection set successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred while setting the connection: {ex.Message}");
            }
        }

        [HttpGet("GetAllTables")]
        public ActionResult GetAllTables()
        {
            try
            {
                var tables = _databaseService.GetAllTables();
                return Ok(tables);
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred while retrieving tables: {ex.Message}");
            }
        }

        [HttpGet("GetAllColumns")]
        public ActionResult GetAllColumns(string tableName)
        {
            try
            {
                var columns = _databaseService.GetAllColumns(tableName);
                return Ok(columns);
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred while retrieving columns for table {tableName}: {ex.Message}");
            }
        }
    }
}
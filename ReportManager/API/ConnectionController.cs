using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using System;

namespace ReportManager.API
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConnectionController : ControllerBase
    {
        private readonly ConnectionService _connectionService;
        private string _temporaryConnectionString;

        public ConnectionController(ConnectionService connectionService)
        {
            _connectionService = connectionService;
        }

        [HttpGet("GetServerConnections")]
        public ActionResult GetServerConnections(string ownerId, OwnerType ownerType)
        {
            var result = _connectionService.GetServerConnections(ownerId, ownerType);
            return Ok(result);
        }

        [HttpGet("GetDBConnections")]
        public ActionResult GetDBConnections(string ownerId, OwnerType ownerType)
        {
            var result = _connectionService.GetDBConnections(ownerId, ownerType);
            return Ok(result);
        }

        [HttpPost("AddServer")]
        public IActionResult AddServerConnection([FromBody] ServerConnectionModel newServer)
        {
            ObjectId? newId = _connectionService.ServerConnection(newServer, true);
            if (newId == null) return BadRequest("Failed to add server connection.");
            return Ok(newId);
        }

        [HttpPost("AddDB")]
        public IActionResult AddDBConnection([FromBody] DBConnectionModel newDB)
        {
            ObjectId newId = _connectionService.SaveNewDBConnection(newDB);
            return Ok(newId);
        }

        [HttpPut("UpdateServer")]
        public IActionResult UpdateServerConnection([FromBody] ServerConnectionModel updatedServer)
        {
            bool isUpdated = _connectionService.UpdateServerConnection(updatedServer);
            if (!isUpdated) return BadRequest("Failed to update.");
            return Ok("Updated successfully");
        }

        [HttpPut("UpdateDB")]
        public IActionResult UpdateDBConnection([FromBody] DBConnectionModel updatedDB)
        {
            bool isUpdated = _connectionService.UpdateDBConnection(updatedDB);
            if (!isUpdated) return BadRequest("Failed to update.");
            return Ok("Updated successfully");
        }

        [HttpGet("verify")]
        public IActionResult VerifyConnectivity([FromBody] ServerConnectionModel serverConnection)
        {
            var (isSuccessful, message) = _connectionService.PreviewConnection(serverConnection);
            return isSuccessful ? Ok(message) : BadRequest(message);
        }
    }
}
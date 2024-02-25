using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver.Core.Configuration;
using Org.BouncyCastle.Asn1.Ocsp;
using ReportManager.Models;
using ReportManager.Services;
using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace ReportManager.API
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConnectionController : ControllerBase
    {
        private readonly ConnectionService _connectionService;
        private readonly SharedService _sharedService;
        private readonly GroupManagementService _groupManagementService;

        public class ConnectionRequest
        {
            public string Id { get; set; }
            [Required]
            public string ServerName { get; set; }
            [Required]
            public int Port { get; set; }
            public string? Instance { get; set; }
            [Required]
            public string DbType { get; set; }
            public string? Username { get; set; }
            public string? Password { get; set; }
            [Required]
            public string AuthType { get; set; }
            [Required]
            public string OwnerID { get; set; }
            [Required]
            public string OwnerType { get; set; }
            public string? AuthSource { get; set; }
            public string? ReplicaSet { get; set; }
            public bool UseTLS { get; set; }
        }

        public class DuplicateConnectionRequest
        {
            [Required]
            public string Id { get; set; }
            [Required]
            public string OwnerID { get; set; }
            [Required]
            public string OwnerType { get; set; }
            [Required]
            public string OldOwnerType { get; set; }
        }

        public class DBConnectionRequest
        {
            [Required]
            public string Id { get; set; }
            public string CollectionCategory { get; set; }
            public string FriendlyName { get; set; }
            public string? Schema {  get; set; }
            [Required]
            public string DatabaseName { get; set; }
        }

        public ConnectionController(ConnectionService connectionService, SharedService sharedService, GroupManagementService groupManagementService)
        {
            _connectionService = connectionService;
            _sharedService = sharedService;
            _groupManagementService = groupManagementService;
        }

        [HttpGet("GetServerConnections")]
        public ActionResult GetServerConnections(string ownerId, string in_ownerType)
        {
            OwnerType ownerType = (OwnerType)Enum.Parse(typeof(OwnerType), in_ownerType);
            var result = _connectionService.GetServerConnections(ownerId, ownerType);
            return Ok(result);
        }

        [HttpGet("GetDBConnections")]
        public ActionResult GetDBConnections(string ownerId, string in_ownerType)
        {
            OwnerType ownerType = (OwnerType)Enum.Parse(typeof(OwnerType), in_ownerType);
            var result = _connectionService.GetDBConnections(ownerId, ownerType);
            return Ok(result);
        }

        [HttpGet("FetchServerConnection")]
        public ActionResult FetchServerConnection(string connectionId, string ownerId, string ownerType)
        {
            if (!ObjectId.TryParse(connectionId, out var objectId))
            {
                return BadRequest("Invalid connection ID.");
            }

            if (!Enum.TryParse<OwnerType>(ownerType, true, out var parsedOwnerType))
            {
                return BadRequest("Invalid owner type.");
            }

            var serverConnections = _connectionService.GetServerConnections(ownerId, parsedOwnerType);
            var serverConnection = _connectionService.FetchServerConnection(serverConnections, objectId);

            return serverConnection != null ? Ok(serverConnection) : NotFound("Server connection not found.");
        }

        [HttpGet("FetchDBConnection")]
        public ActionResult FetchDBConnection(string connectionId, string ownerId, string ownerType)
        {
            if (!ObjectId.TryParse(connectionId, out var objectId))
            {
                return BadRequest("Invalid connection ID.");
            }

            if (!Enum.TryParse<OwnerType>(ownerType, true, out var parsedOwnerType))
            {
                return BadRequest("Invalid owner type.");
            }

            var dbConnections = _connectionService.GetDBConnections(ownerId, parsedOwnerType);
            var dbConnection = _connectionService.FetchDBConnection(dbConnections, objectId);

            return dbConnection != null ? Ok(dbConnection) : NotFound("Database connection not found.");
        }

        [HttpGet("GetAllConnections")]
        public ActionResult GetAllConnections(string ownerId, string ownerTypeString, string connectionType)
        {
            OwnerType ownerType = (OwnerType)Enum.Parse(typeof(OwnerType), ownerTypeString, true);
            var result = _connectionService.FetchConnections(ownerId, ownerType, connectionType);
            return Ok(result);
        }

        [HttpGet("GetAllConnectionsForUserAndGroups")]
        public ActionResult GetAllConnectionsForUserAndGroups(string userId, string username)
        {
            var allConnections = new List<object>();
            var userGroups = _groupManagementService.GetGroupsByUser(username);
            var userConnections = _connectionService.FetchConnectionsForOwner(userId, "User", "server", username)
                                   .ToList();

            allConnections.AddRange(userConnections);
            foreach (var group in userGroups)
            {
                var groupName = _groupManagementService.GetGroup(group.Id)?.GroupName;
                var groupConnections = _connectionService.FetchConnectionsForOwner(group.Id.ToString(), "Group", "server", groupName)
                                       .ToList();
                allConnections.AddRange(groupConnections);
            }

            return Ok(allConnections);
        }

        [HttpPost("DuplicateServerConnection")]
        public async Task<IActionResult> DuplicateServerConnection(DuplicateConnectionRequest data)
        {
            OwnerType _ownertype = (OwnerType)Enum.Parse(typeof(OwnerType), data.OldOwnerType);
            BaseConnectionModel? serverConnection = _connectionService.GetServerConnectionById(_sharedService.StringToObjectId(data.Id), _ownertype);
            if (serverConnection == null) return BadRequest("Server does not exist.");
            BaseConnectionModel _serverConnection = new BaseConnectionModel()
            {
                ServerName = serverConnection.ServerName,
                Port = serverConnection.Port,
                Instance = serverConnection.Instance,
                DbType = serverConnection.DbType,
                Username = serverConnection.Username,
                Password = serverConnection.Password,
                AuthType = serverConnection.AuthType,
                OwnerID = _sharedService.StringToObjectId(data.OwnerID),
                OwnerType = (OwnerType)Enum.Parse(typeof(OwnerType), data.OwnerType),
                /*AuthSource = serverConnection.AuthSource,
                ReplicaSet = serverConnection.ReplicaSet,
                UseTLS = serverConnection.UseTLS*/
            };
            ObjectId? newId = await _connectionService.AddServerConnection(_serverConnection, true);
            if (newId == null) return BadRequest("Failed to add server connection.");
            return Ok(newId.ToString());
        }

        [HttpPost("AddServerConnection")]
        public async Task<IActionResult> AddServerConnection(ConnectionRequest data)
        {

            OwnerType ownerType = (OwnerType)Enum.Parse(typeof(OwnerType), data.OwnerType);
            ObjectId ownerId = _sharedService.StringToObjectId(data.OwnerID);

            var existingConnection = await _connectionService.FindServerConnection(
                data.ServerName,
                data.Port,
                data.DbType,
                ownerId,
                ownerType
            );

            if (existingConnection != null)
            {
                return Ok(new { Id = existingConnection.Id.ToString(), Message = "Existing server connection." });
            }

            BaseConnectionModel newServer = new BaseConnectionModel()
            {
                ServerName = data.ServerName,
                Port = data.Port,
                Instance = data.Instance,
                DbType = data.DbType,
                Username = data.Username,
                Password = data.Password,
                AuthType = data.AuthType,
                OwnerID = ownerId,
                OwnerType = ownerType,
                /*AuthSource = data.AuthSource,
                ReplicaSet = data.ReplicaSet,
                UseTLS = data.UseTLS*/
            };

            ObjectId? newId = await _connectionService.AddServerConnection(newServer, true);
            if (newId == null)
            {
                return BadRequest("Failed to add server connection.");
            }
            return Ok(newId.ToString());
        }

        [HttpPost("AddDBConnection")]
        public async Task<IActionResult> AddDBConnection(DBConnectionRequest data)
        {
            OwnerType _ownertype = (OwnerType)Enum.Parse(typeof(OwnerType), data.CollectionCategory);
            BaseConnectionModel? serverConnection = _connectionService.GetServerConnectionById(_sharedService.StringToObjectId(data.Id), _ownertype);
            if (serverConnection == null) return BadRequest("Server does not exist.");

            // TODO: Duplicate check
            DBConnectionModel newDB = new DBConnectionModel()
            {
                ServerName = serverConnection.ServerName,
                Port = serverConnection.Port,
                Instance = serverConnection.Instance,
                DbType = serverConnection.DbType,
                Username = serverConnection.Username,
                Password = serverConnection.Password,
                AuthType = serverConnection.AuthType,
                OwnerID = serverConnection.OwnerID,
                OwnerType = serverConnection.OwnerType,
                /*AuthSource = serverConnection.AuthSource,
                ReplicaSet = serverConnection.ReplicaSet,
                UseTLS = serverConnection.UseTLS,*/
                DatabaseName = data.DatabaseName,
                FriendlyName = data.FriendlyName,
                Schema = data.Schema
            };

            (bool success, string message) = _connectionService.PreviewConnection(newDB);
            if (!success)
                return BadRequest(message);

            ObjectId? newId = await _connectionService.SaveNewDBConnection(newDB);
            if (newId == null) return BadRequest("Failed to add DB connection.");
            string builtConnectionString = ConnectionService.BuildConnectionString(newDB);
            BuiltConnectionString connStr = new BuiltConnectionString
            {
                ConnectionId = newId.Value,
            };
            connStr.SetEncryptedConnectionString(builtConnectionString);
            await _connectionService.AddConnectionString(connStr);
            return Ok(newId.ToString());
        }

        [HttpPut("UpdateServer")]
        public IActionResult UpdateServerConnection([FromBody] BaseConnectionModel updatedServer)
        {
            bool isUpdated = _connectionService.UpdateServerConnection(updatedServer);
            if (!isUpdated) return BadRequest("Failed to update.");
            return Ok("Updated successfully");
        }

        public async Task<IActionResult> UpdateDBConnection([FromBody] DBConnectionModel updatedDB)
        {
            bool isUpdated = _connectionService.UpdateDBConnection(updatedDB);
            if (!isUpdated) return BadRequest("Failed to update.");

            string builtConnectionString = ConnectionService.BuildConnectionString(updatedDB);
            ObjectId? connStrId = await _connectionService.GetBuiltConnectionStringId(updatedDB.Id);
            if (!connStrId.HasValue)
            {
                return BadRequest("Associated connection string not found.");
            }
            BuiltConnectionString connStr = new BuiltConnectionString
            {
                Id = connStrId.Value,
                ConnectionId = updatedDB.Id,
            };
            connStr.SetEncryptedConnectionString(builtConnectionString);
            await _connectionService.UpdateBuiltConnectionString(connStr);

            return Ok("Updated successfully");
        }

        [HttpDelete("DeleteServerConnection/{connectionId}")]
        public ActionResult DeleteServerConnection(string connectionId)
        {
            if (string.IsNullOrWhiteSpace(connectionId))
            {
                return BadRequest("Connection ID is required.");
            }

            try
            {
                ObjectId id = _sharedService.StringToObjectId(connectionId);

                bool isSuccess = _connectionService.DeleteServerConnection(id);
                if (isSuccess)
                {
                    return Ok("Server connection deleted successfully.");
                }
                else
                {
                    return NotFound("Server connection not found.");
                }
            }
            catch (FormatException)
            {
                return BadRequest("Invalid connection ID format.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while deleting the server connection.");
            }
        }

        [HttpPost("verify")]
        public IActionResult VerifyConnectivity(ConnectionRequest request)
        {
            BaseConnectionModel connection = new BaseConnectionModel
            {
                ServerName = request.ServerName,
                Port = request.Port,
                Instance = request.Instance,
                DbType = request.DbType,
                Username = request.Username,
                Password = request.Password,
                AuthType = request.AuthType,
                /*AuthSource = request.AuthSource,
                ReplicaSet = request.ReplicaSet,
                UseTLS = request.UseTLS*/
            };

            var (isSuccessful, message) = _connectionService.PreviewConnection(connection);
            return isSuccessful ? Ok(message) : BadRequest(message);
        }
    }
}
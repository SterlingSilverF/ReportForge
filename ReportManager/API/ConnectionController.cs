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



        public class UpdateDBConnectionRequest
        {
            [Required]
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
            public string CollectionCategory { get; set; }
            public string FriendlyName { get; set; }
            public string? Schema { get; set; }
            [Required]
            public string DatabaseName { get; set; }
            public string? AuthSource { get; set; }
            public string? ReplicaSet { get; set; }
            public bool UseTLS { get; set; }
        }

        public class DBConnectionRequest
        {
            [Required]
            public string Id { get; set; }
            [Required]
            public string OwnerID { get; set; }
            public string CollectionCategory { get; set; }
            public string FriendlyName { get; set; }
            public string? Schema { get; set; }
            [Required]
            public string DatabaseName { get; set; }
        }

        public ConnectionController(ConnectionService connectionService, SharedService sharedService, 
            GroupManagementService groupManagementService)
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
        public ActionResult<ServerConnectionDTO> FetchServerConnection(string connectionId, string ownerId, string ownerType)
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

            if (serverConnection == null)
            {
                return NotFound("Server connection not found.");
            }

            var dto = new ServerConnectionDTO(serverConnection, "");
            return Ok(dto);
        }

        [HttpGet("FetchDBConnection")]
        public ActionResult<DBConnectionDTO> FetchDBConnection(string connectionId, string ownerId, string ownerType)
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

            if (dbConnection == null)
            {
                return NotFound("Database connection not found.");
            }

            var dto = new DBConnectionDTO(dbConnection, "");
            return Ok(dto);
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
            var allConnections = new List<SimpleConnectionDTO>();
            var userGroups = _groupManagementService.GetGroupsByUser(username);
            var userServerConnections = _connectionService.FetchConnectionsForOwner(userId, "Personal", "server", username)
                .Select(c => new SimpleConnectionDTO
                {
                    Id = c.Id,
                    ServerName = c.ServerName,
                    OwnerName = c.OwnerName,
                    OwnerId = userId,
                    OwnerType = c.OwnerType,
                    ConnectionType = "Server",
                    DbType = c.DbType
                })
                .ToList();
            allConnections.AddRange(userServerConnections);
            var userDatabaseConnections = _connectionService.FetchConnectionsForOwner(userId, "Personal", "database", username)
                .Select(c => new SimpleConnectionDTO
                {
                    Id = c.Id,
                    ServerName = c.ServerName,
                    OwnerName = c.OwnerName,
                    OwnerId = userId,
                    OwnerType = c.OwnerType,
                    ConnectionType = "Database",
                    DbType = c.DbType
                })
                .ToList();
            allConnections.AddRange(userDatabaseConnections);

            foreach (var group in userGroups)
            {
                var groupName = _groupManagementService.GetGroup(group.Id)?.GroupName;
                var groupId = group.Id.ToString();
                var groupServerConnections = _connectionService.FetchConnectionsForOwner(groupId, "Group", "server", groupName)
                    .Select(c => new SimpleConnectionDTO
                    {
                        Id = c.Id,
                        ServerName = c.ServerName,
                        OwnerName = c.OwnerName,
                        OwnerId = groupId,
                        OwnerType = c.OwnerType,
                        ConnectionType = "Server",
                        DbType = c.DbType
                    })
                    .ToList();
                allConnections.AddRange(groupServerConnections);
                var groupDatabaseConnections = _connectionService.FetchConnectionsForOwner(groupId, "Group", "database", groupName)
                    .Select(c => new SimpleConnectionDTO
                    {
                        Id = c.Id,
                        ServerName = c.ServerName,
                        OwnerName = c.OwnerName,
                        OwnerId = groupId,
                        OwnerType = c.OwnerType,
                        ConnectionType = "Database",
                        DbType = c.DbType
                    })
                    .ToList();
                allConnections.AddRange(groupDatabaseConnections);
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
            ObjectId connectionId = _sharedService.StringToObjectId(data.Id);
            BaseConnectionModel serverConnection = _connectionService.GetServerConnectionById(connectionId, Enum.Parse<OwnerType>("Group"))
                ?? _connectionService.GetServerConnectionById(connectionId, Enum.Parse<OwnerType>("Personal"));

            if (serverConnection == null)
            {
                return NotFound("Server does not exist.");
            }
            
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
                OwnerID = _sharedService.StringToObjectId(data.OwnerID),
                OwnerType = _ownertype,
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

        [HttpPut("UpdateServerConnection")]
        public async Task<IActionResult> UpdateServerConnection(ConnectionRequest updatedServer)
        {
            BaseConnectionModel connection = new BaseConnectionModel
            {
                Id = _sharedService.StringToObjectId(updatedServer.Id),
                ServerName = updatedServer.ServerName,
                Port = updatedServer.Port,
                Instance = updatedServer.Instance,
                DbType = updatedServer.DbType,
                Username = updatedServer.Username,
                Password = updatedServer.Password,
                AuthType = updatedServer.AuthType,
                OwnerID = _sharedService.StringToObjectId(updatedServer.OwnerID),
                OwnerType = (OwnerType)Enum.Parse(typeof(OwnerType), updatedServer.OwnerType),
                /*AuthSource = updatedServer.AuthSource,
                ReplicaSet = updatedServer.ReplicaSet,
                UseTLS = updatedServer.UseTLS*/
            };

            bool isUpdated = _connectionService.UpdateServerConnection(connection);

            if (!isUpdated)
            {
                var existingConnection = _connectionService.GetServerConnectionById(connection.Id, connection.OwnerType);
                if (existingConnection != null && _connectionService.AreConnectionsEqual(existingConnection, connection))
                {
                    return Ok("No changes detected. Connection already up to date.");
                }
                else
                {
                    return BadRequest("Failed to update.");
                }
            }

            return Ok("Updated successfully");
        }

        [HttpPut("UpdateDBConnection")]
        public async Task<IActionResult> UpdateDBConnection(UpdateDBConnectionRequest updatedDB)
        {
            DBConnectionModel connection = new DBConnectionModel
            {
                Id = _sharedService.StringToObjectId(updatedDB.Id),
                ServerName = updatedDB.ServerName,
                Port = updatedDB.Port,
                Instance = updatedDB.Instance,
                DbType = updatedDB.DbType,
                Username = updatedDB.Username,
                Password = updatedDB.Password,
                AuthType = updatedDB.AuthType,
                OwnerID = _sharedService.StringToObjectId(updatedDB.OwnerID),
                OwnerType = (OwnerType)Enum.Parse(typeof(OwnerType), updatedDB.CollectionCategory),
                DatabaseName = updatedDB.DatabaseName,
                FriendlyName = updatedDB.FriendlyName,
                Schema = updatedDB.Schema
            };

            bool isUpdated = _connectionService.UpdateDBConnection(connection);

            if (!isUpdated)
            {
                var existingConnection = _connectionService.GetDBConnectionById(connection.Id, connection.OwnerType);
                if (existingConnection != null && _connectionService.AreDBConnectionsEqual(existingConnection, connection))
                {
                    return Ok("No changes detected. Connection already up to date.");
                }
                else
                {
                    return BadRequest("Failed to update.");
                }
            }

            string builtConnectionString = ConnectionService.BuildConnectionString(connection);
            ObjectId? connStrId = await _connectionService.GetBuiltConnectionStringId(connection.Id);

            if (!connStrId.HasValue)
            {
                return BadRequest("Associated connection string not found.");
            }

            BuiltConnectionString connStr = new BuiltConnectionString
            {
                Id = connStrId.Value,
                ConnectionId = connection.Id,
            };
            connStr.SetEncryptedConnectionString(builtConnectionString);
            await _connectionService.UpdateBuiltConnectionString(connStr);

            return Ok("Updated successfully");
        }

        [HttpDelete("DeleteConnection")]
        public async Task<ActionResult> DeleteConnection(string connectionId, string ownerType)
        {
            if (!Enum.TryParse(ownerType, true, out OwnerType _ownerType))
            {
                return BadRequest("Invalid owner type.");
            }

            try
            {
                ObjectId id = _sharedService.StringToObjectId(connectionId);
                bool isSuccess = await _connectionService.DeleteServerOrDBConnection(id, _ownerType);

                if (isSuccess)
                {
                    ObjectId? builtConnectionStringId = await _connectionService.GetBuiltConnectionStringId(id);
                    if (builtConnectionStringId.HasValue)
                    {
                        await _connectionService.DeleteBuiltConnectionString(builtConnectionStringId.Value);
                    }

                    return Ok("Connection deleted successfully.");
                }
                else
                {
                    return StatusCode(500, "An error occurred while deleting the connection.");
                }
            }
            catch (FormatException)
            {
                return BadRequest("Invalid connection ID format.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while deleting the connection.");
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
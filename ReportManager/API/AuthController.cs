using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManager.Services;
using System.ComponentModel.DataAnnotations;
using System;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using ReportManager.Models.SettingsModels;
using Microsoft.Extensions.Options;

namespace ReportManager.API
{
    [ApiController]
    [Route("api/{controller}")]
    public class AuthController : ControllerBase
    {
        private readonly UserManagementService _authService;
        private readonly GroupManagementService _groupManagementService;
        private readonly FolderManagementService _folderManagementService;
        private readonly IConfiguration _configuration;
        private readonly AppDatabaseService _appDatabaseService;
        private readonly JwtSettings _jwtSettings;
        private string basePath;

        public class LoginRequest
        {
            [Required]
            [StringLength(50, MinimumLength = 3)]
            public string username { get; set; }

            [Required]
            [StringLength(50, MinimumLength = 8)]
            public string password { get; set; }
        }

        public class UserRegistrationRequest
        {
            [Required]
            [StringLength(50, MinimumLength = 3)]
            public string username { get; set; }

            [Required]
            [StringLength(50, MinimumLength = 8)]
            public string password { get; set; }

            public string? permission_key { get; set; }
            public string? email { get; set; }
        }

        public class AdminRegistrationRequest
        {
            [Required]
            [StringLength(50, MinimumLength = 3)]
            public string username { get; set; }

            [Required]
            [StringLength(50, MinimumLength = 8)]
            public string password { get; set; }

            [Required]
            public string groupname { get; set; }

            public string permission_key { get; set; }
            public string? email { get; set; }
        }

        public class GeneratePermissionKeyRequest
        {
            [Required]
            public string Username { get; set; }

            [Required]
            public string Groupname { get; set; }

            [Required]
            public string UserType { get; set; }

            [Required]
            public int ExpirationDuration { get; set; }

            [Required]
            public string DurationUnit { get; set; }
        }

        // TODO: Split this into two for first time and normal
        public AuthController(UserManagementService authService, GroupManagementService groupManagementService, 
            AppDatabaseService databaseService, FolderManagementService folderManagementService, IConfiguration configuration, IOptions<JwtSettings> jwtSettings)
        {
            _authService = authService;
            _groupManagementService = groupManagementService;
            _folderManagementService = folderManagementService;
            _appDatabaseService = databaseService;
            _configuration = configuration;
            _jwtSettings = jwtSettings.Value;
            var permissionKeyCollection = databaseService.GetCollection<PermissionKeyModel>("PermissionKeys");
            var basePathValue = _configuration.GetValue<string>("BasePath");
            basePath = (basePathValue == null) ? "C:/ReportForge/" : basePathValue;
            Encryptor.Initialize(permissionKeyCollection);
        }

        [HttpPost("register")]
        public IActionResult Register(UserRegistrationRequest request)
        {
            if (_authService.DoesUserExist(request.username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            if (!_authService.IsValidPassword(request.password))
            {
                return BadRequest(new { message = "Password does not meet requirements" });
            }

            if (request.permission_key != null && !_authService.IsValidPermissionKey(request.permission_key))
            {
                return BadRequest(new { message = "Invalid permission key" });
            }

            var salt = Encryptor.PasswordHelper.GenerateSalt();
            var hashedPassword = Encryptor.PasswordHelper.HashPassword(request.password, salt);
            UserType _userType = UserType.InActive;

            User _user = new User
            {
                Username = request.username,
                HashedPassword = hashedPassword,
                Salt = salt,
                UserType = _userType,
                Email = request.email
            };

            string isRegistered = "";
            if (request.permission_key != null)
            {
                if (Encryptor.VerifyPermissionKey(request.permission_key, out var groupname, out var userType))
                {
                    _user.UserType = userType;
                    isRegistered = _authService.RegisterUser(_user);

                    _Group topGroup = _groupManagementService.GetTopGroup();
                    topGroup.GroupMembers.Add(request.username);
                    _groupManagementService.UpdateGroup(topGroup);

                    if (groupname != null)
                    {
                        _Group? group = _groupManagementService.GetGroupByName(groupname);
                        if (group != null)
                        {
                            group.GroupMembers.Add(request.username);
                            _groupManagementService.UpdateGroup(group);
                        }
                    }
                }
                else
                {
                    isRegistered = _authService.RegisterUser(_user);
                }
            }
           
            PersonalFolder personalFolder = new PersonalFolder
            {
                FolderName = request.username,
                FolderPath = basePath + "Users/" + request.username + "/",
                IsObjectFolder = true,
                Owner = _user.Id
            };

            bool dbFolderCreated = _folderManagementService.CreateDBPersonalFolder(personalFolder);

            if (isRegistered == "User created successfully." && dbFolderCreated)
            {
                return Ok(new { message = "User successfully registered" });
            }
            else
            {
                string errorMessage = "Registration failed";
                if (isRegistered != "User successfully registered.")
                {
                    errorMessage = "Failed to register user: " + isRegistered;
                }
                else if (!dbFolderCreated)
                {
                    // TODO: delete user and folders
                    errorMessage = "Failed to create database folder record";
                }

                return BadRequest(new { message = errorMessage });
            }
        }

        [HttpGet("windows-auth")]
        [Authorize]
        public IActionResult WindowsAuth()
        {
            return Ok(new { username = User.Identity.Name });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            bool isAuthenticated = _authService.AuthenticateManualUser(request);

            if (isAuthenticated)
            {
                User user = _authService.GetUserByUsername(request.username);

                var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecurityKey));
                var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

                var claims = new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, request.username),
                    new Claim("UserId", user.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                };

                var token = new JwtSecurityToken(
                    issuer: _jwtSettings.ValidIssuer,
                    audience: _jwtSettings.ValidAudience,
                    claims: claims,
                    expires: DateTime.Now.AddMinutes(30),
                    signingCredentials: credentials
                );

                return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
            }
            return Unauthorized();
        }

        [HttpPost("firsttimesetup")]
        public IActionResult FirstTimeSetup([FromBody] AdminRegistrationRequest request)
        {
            // Validate the permission key
            if (!_authService.IsValidPermissionKey(request.permission_key))
            {
                return BadRequest(new { message = "Invalid permission key" });
            }

            AdminAppSetup adminAppSetup = new AdminAppSetup(_configuration, _appDatabaseService);
            adminAppSetup.CreateDatabaseCollections();

            // Create the physical app (basepath), Users, and Groups folders
            if (!Directory.Exists(basePath))
            {
               _folderManagementService.CreatePhysicalFolder(basePath);
            }

            string usersPath = Path.Combine(basePath, "Users/");
            string groupsPath = Path.Combine(basePath, "Groups/");
            _folderManagementService.DeletePhysicalFolder("Users/");
            _folderManagementService.DeletePhysicalFolder("Groups/");

            if (!_folderManagementService.CreatePhysicalFolder(usersPath) ||
                !_folderManagementService.CreatePhysicalFolder(groupsPath))
            {
                return BadRequest(new { message = "Failed to create essential directories" });
            }

            // Create the first admin user
            var salt = Encryptor.PasswordHelper.GenerateSalt();
            var hashedPassword = Encryptor.PasswordHelper.HashPassword(request.password, salt);

            User adminUser = new User
            {
                Username = request.username,
                HashedPassword = hashedPassword,
                Salt = salt,
                UserType = UserType.Admin,
                Email = request.email
            };

            if (!_authService.RegisterAdminUser(adminUser).Equals("User created successfully."))
            {
                return BadRequest(new { message = "Failed to register the admin user" });
            }

            // Create admin group folder
            string adminGroupFolderPath = Path.Combine(groupsPath, request.groupname + "/");
            if (!_folderManagementService.CreatePhysicalFolder(adminGroupFolderPath))
            {
                return BadRequest(new { message = "Failed to create the group folder" });
            }

            FolderModel groupFolder = new FolderModel
            {
                FolderPath = adminGroupFolderPath,
                FolderName = request.groupname,
                IsObjectFolder = true
                // ParentId = null
            };

            var groupFolderId = _folderManagementService.CreateDBFolder(groupFolder);
            if (groupFolderId == null)
            {
                return BadRequest(new { message = "Failed to create the group folder in DB" });
            }

            // Create the first admin group
            _Group adminGroup = new _Group
            {
                GroupName = request.groupname,
                Folders = new HashSet<ObjectId> { groupFolder.Id },
                GroupOwners = new HashSet<string> { request.username },
                GroupMembers = new HashSet<string> { request.username },
                IsTopGroup = true
                // ParentId = null
            };
            adminGroup = _groupManagementService.CreateAdminGroup(adminGroup);

            PersonalFolder _folder = new PersonalFolder
            {
                FolderPath = usersPath + request.username + "/",
                FolderName = request.username,
                IsObjectFolder = false,
                Owner = adminUser.Id
            };

            if (!_folderManagementService.CreateDBPersonalFolder(_folder))
            {
                return BadRequest(new { message = "Failed to create the user's personal folder" });
            }

            return Ok(new { message = "First-time setup completed successfully" });
        }

        [HttpPost("generatePermissionKey")]
        public IActionResult GeneratePermissionKey([FromBody] GeneratePermissionKeyRequest request)
        {
            if (!Enum.TryParse<UserType>(request.UserType, out UserType userType))
            {
                return BadRequest("Invalid user type.");
            }
            var expiration = CalculateExpiration(request.ExpirationDuration, request.DurationUnit);
            var key = Encryptor.GeneratePermissionKey(request.Username, request.Groupname, userType, expiration);

            return Ok(new { Key = key });
        }

        [HttpDelete("clearGroupKeys")]
        public IActionResult ClearGroupKeys(string groupname)
        {
            try
            {
                Encryptor.ClearGroupKeys(groupname);
                return Ok(new { message = "Group keys cleared successfully." });
            } 
            catch (Exception ex) {
                return BadRequest(new { message = "An error occured in deletion." });
            }
        }

        private DateTime? CalculateExpiration(int duration, string unit)
        {
            if (unit == "never") return null;

            return unit switch
            {
                "minute" => DateTime.UtcNow.AddMinutes(duration),
                "hour" => DateTime.UtcNow.AddHours(duration),
                "day" => DateTime.UtcNow.AddDays(duration),
                "week" => DateTime.UtcNow.AddDays(7 * duration),
                "month" => DateTime.UtcNow.AddMonths(duration),
                _ => DateTime.UtcNow
            };
        }
    }
}
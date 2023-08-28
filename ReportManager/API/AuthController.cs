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

            if (request.permission_key != null)
            {
                if (Encryptor.TryDecodePermissionKey(request.permission_key, out var createdusername, out var groupname, out var userType))
                {
                    _user.UserType = userType;
                    _authService.UpdateUser(_user);

                    _Group topGroup = _groupManagementService.GetTopGroup();
                    topGroup.GroupMembers.Add(_user.Id);
                    _groupManagementService.UpdateGroup(topGroup);

                    if (groupname != null)
                    {
                        _Group? group = _groupManagementService.GetGroupByName(groupname);
                        if (group != null)
                        {
                            group.GroupMembers.Add(_user.Id);
                            _groupManagementService.UpdateGroup(group);
                        }
                        return BadRequest(new { message = "Group does not exist." });
                    }
                }
                else
                {
                    return BadRequest(new { message = "Invalid permission key" });
                }
            }

            string isRegistered = _authService.RegisterUser(_user);
            if (isRegistered == "User successfully registered.")
            {
                return Ok(new { message = "User successfully registered" });
            }
            else
            {
                return BadRequest(new { message = "Registration failed" });
                // TODO: Log exception
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

            // Create the first folder
            FolderModel folder = new FolderModel
            {
                FolderName = request.groupname,
                FolderPath = "//" + request.groupname,
            };

            _folderManagementService.CreateFolder(folder);

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

            // Create the first admin group
            _Group adminGroup = new _Group
            {
                GroupName = request.groupname,
                Folders = new List<ObjectId>{ folder.Id },
                GroupOwners = new List<ObjectId> { adminUser.Id },
                GroupMembers = new List<ObjectId> { adminUser.Id },
                IsTopGroup = true
            };
            adminGroup = _groupManagementService.CreateAdminGroup(adminGroup);

            return Ok(new { message = "First-time setup completed successfully" });
        }
    }
}
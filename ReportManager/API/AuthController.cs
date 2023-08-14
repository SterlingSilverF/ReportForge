using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReportManager.Services;

namespace ReportManager.API
{
    [ApiController]
    [Route("api/{controller}")]
    public class AuthController : ControllerBase
    {
        private readonly UserManagementService _authService;

        public class LoginRequest
        {
            public string username { get; set; }
            public string password { get; set; }
        }

        public class UserRegistrationRequest
        {
            public string username { get; set; }
            public string password { get; set; }
            public string groupname { get; set; }
            public string? permission_key { get; set;}
        }

        public class AdminRegistrationRequest
        {
            public string username { get; set; }
            public string password { get; set; }
            public string groupname { get; set; }
            public string permission_key { get; set; }
        }

        public AuthController(UserManagementService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public IActionResult Register(UserRegistrationRequest request)
        {
            // Check if the username already exists
            if (_authService.DoesUserExist(request.username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            // Validate group name
            if (!_authService.IsValidGroupName(request.groupname))
            {
                return BadRequest(new { message = "Invalid group name" });
            }

            // Validate password requirements
            if (!IsValidPassword(request.password))
            {
                return BadRequest(new { message = "Password does not meet requirements" });
            }

            // Handle optional permission key if provided
            if (request.permission_key != null && !_authService.IsValidPermissionKey(request.permission_key))
            {
                return BadRequest(new { message = "Invalid permission key" });
            }

            var salt = Encryptor.PasswordHelper.GenerateSalt();
            var hashedPassword = Encryptor.PasswordHelper.HashPassword(request.password, salt);

            bool isRegistered = _authService.RegisterUser(request.username, hashedPassword, salt, request.groupname);

            if (isRegistered)
            {
                return Ok(new { message = "User successfully registered" });
            }

            return BadRequest(new { message = "Registration failed" });
        }


        [HttpPost("admin-register")]
        public IActionResult AdminRegister(AdminRegistrationRequest request)
        {
            // Validate the unique generated key
            if (!_authService.IsValidAdminKey(request.permission_key))
            {
                return BadRequest(new { message = "Invalid setup key" });
            }

            // Check for unique username
            if (_authService.DoesUserExist(request.username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            // Validate password requirements
            if (!IsValidPassword(request.password))
            {
                return BadRequest(new { message = "Password does not meet requirements" });
            }

            var salt = Encryptor.PasswordHelper.GenerateSalt();
            var hashedPassword = Encryptor.PasswordHelper.HashPassword(request.password, salt);

            bool isRegistered = _authService.RegisterAdmin(request.username, hashedPassword, salt, request.groupname);

            if (isRegistered)
            {
                // Optionally, you can disable further admin registration here
                return Ok(new { message = "Admin successfully registered" });
            }

            return BadRequest(new { message = "Registration failed" });
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
                // You can return a JWT token, session ID, or any other authentication mechanism here.
                return Ok(new { token = "yourGeneratedToken" });
            }

            return Unauthorized();
        }
    }
}
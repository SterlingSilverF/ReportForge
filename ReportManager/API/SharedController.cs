using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ReportManager.Models;
using ReportManager.Services;

namespace ReportManager.API
{
    [ApiController]
    [Route("api/[controller]")]
    public class SharedController : ControllerBase
    {
        private readonly UserManagementService _userManagementService;
        private readonly GroupManagementService _groupManagementService;

        public SharedController(UserManagementService userManagementService, GroupManagementService groupManagementService)
        {
            _userManagementService = userManagementService;
            _groupManagementService = groupManagementService;
        }

        [HttpGet("getAllUsernames")]
        public IActionResult GetAllUsernames()
        {
            try
            {
                return Ok(_userManagementService.GetAllUsernames());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("updateUserType")]
        public IActionResult UpdateUserType(string username, UserType userType)
        {
            try
            {
                return Ok(_userManagementService.UpdateUserType(username, userType));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("modifyGroupOwnership")]
        public IActionResult ModifyGroupOwnership(ObjectId groupId, HashSet<string> newOwners)
        {
            try
            {
                return Ok(_groupManagementService.ModifyGroupOwnership(groupId, newOwners));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
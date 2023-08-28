using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;
using ReportManager.Models;
using static ReportManager.API.AuthController;

namespace ReportManager.Services
{
    public class UserManagementService
    {
        private readonly IConfiguration _config;
        private IMongoCollection<User> _usersDB;

        public bool IsSSOEnabled() => _config.GetValue<bool>("AuthenticationMethods:SSO_Enabled");
        public bool IsWindowsAuthEnabled() => _config.GetValue<bool>("AuthenticationMethods:Windows_Auth_Enabled");
        public bool IsManualAuthEnabled() => _config.GetValue<bool>("AuthenticationMethods:Manual_Auth_Enabled");

        public UserManagementService(IConfiguration config, AppDatabaseService databaseService)
        {
            _config = config;
            _usersDB = databaseService.GetCollection<User>("Users");
        }

        public bool DoesUserExist(string username)
        {
            var userExists = _usersDB.Find(u => u.Username == username).FirstOrDefault();
            return userExists != null;
        }

        public User GetUserByUsername(string username)
        {
            var filter = Builders<User>.Filter.Eq(u => u.Username, username);
            return _usersDB.Find(filter).FirstOrDefault();
        }

        public string RegisterUser(User user)
        {
            _usersDB.InsertOne(user);
            return "User created successfully.";
        }

        public string RegisterAdminUser(User user)
        {
            if (DoesUserExist(user.Username))
                return "Username already taken.";

            _usersDB.InsertOne(user);
            return "User created successfully.";
        }

        public bool UpdateUser(User updatedUser)
        {
            var filter = Builders<User>.Filter.Eq(g => g.Id, updatedUser.Id);
            var result = _usersDB.ReplaceOne(filter, updatedUser);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public bool IsValidPermissionKey(string permissionKey)
        {
            return true;
        }

        public bool IsValidPassword(string password)
        {
            int minLength = _config.GetValue<int>("PasswordRequirements:MinLength");
            string characterRegex = _config.GetValue<string>("PasswordRequirements:CharacterRegex");

            if (password.Length < minLength)
                return false;
            if (!string.IsNullOrEmpty(characterRegex) && !Regex.IsMatch(password, characterRegex))
                return false;

            return true;
        }

        public bool AuthenticateManualUser(LoginRequest request)
        {
            var user = _usersDB.Find(u => u.Username == request.username).FirstOrDefault();

            if (user == null)
            {
                return false;
            }

            var hashedPasswordToCheck = Encryptor.PasswordHelper.HashPassword(request.password, user.Salt);
            return hashedPasswordToCheck == user.HashedPassword;
        }
    }
}
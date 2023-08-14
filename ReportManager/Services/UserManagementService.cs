using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Reflection.Metadata;
using System.Text.RegularExpressions;
using static ReportManager.API.AuthController;
using ReportManager.Models;

namespace ReportManager.Services
{
    public class UserManagementService
    {
        private readonly IConfiguration _config;
        private IMongoCollection<User> _usersDB;
        private readonly MongoClient client;
        private readonly SharedUtils _sharedUtils;

        public bool IsSSOEnabled() => _config.GetValue<bool>("AuthenticationMethods:SSO_Enabled");
        public bool IsWindowsAuthEnabled() => _config.GetValue<bool>("AuthenticationMethods:Windows_Auth_Enabled");
        public bool IsManualAuthEnabled() => _config.GetValue<bool>("AuthenticationMethods:Manual_Auth_Enabled");

        public UserManagementService(IConfiguration config, SharedUtils sharedUtils)
        {
            _config = config;
            _sharedUtils = sharedUtils;

            try
            {
                var connectionString = _config.GetValue<string>("ConnectionSettings:MongoConnectionString");
                client = new MongoClient(connectionString);
                var _database = client.GetDatabase("ReportForge");
                _usersDB = _database.GetCollection<User>("Users");
            }
            catch (Exception ex)
            {
                // TODO: Handle or log the exception
                throw new ApplicationException("Error initializing database connection", ex);
            }
        }

        public bool DoesUserExist(string username)
        {
            var userExists = _usersDB.Find(u => u.Username == username).FirstOrDefault();
            return userExists != null;
        }

        public string RegisterUser(User user, ObjectId groupId)
        {
            if  (user.UserType != UserType.Admin) 
            {
                if (!_sharedUtils.DoesGroupExist(groupId))
                    return "Group does not exist.";
            }

            if (DoesUserExist(user.Username))
                return "Username already taken.";

            _usersDB.InsertOne(user);
            return "User created successfully.";
        }

        public bool IsValidPermissionKey(string permissionKey)
        {
            // TODO: This is for licensing
            // Will need to account for an already used key
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
using MongoDB.Driver;
using ReportManager.Models;
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

public static class Encryptor
{
    private static readonly string Key = Environment.GetEnvironmentVariable("ReportManager_ENCRYPTION_KEY");
    private static readonly string IV = Environment.GetEnvironmentVariable("ReportManager_ENCRYPTION_IV");
    private static IMongoCollection<PermissionKeyModel> _permissionKeyDB;

    public static void Initialize(IMongoCollection<PermissionKeyModel> permissionKeyDB)
    {
        _permissionKeyDB = permissionKeyDB;
    }

    public static string Encrypt(string input)
    {
        byte[] byteKey = Encoding.UTF8.GetBytes(Key);
        byte[] byteIV = Encoding.UTF8.GetBytes(IV);
        byte[] inputBytes = Encoding.UTF8.GetBytes(input);

        using (Aes aes = Aes.Create())
        {
            aes.Key = byteKey;
            aes.IV = byteIV;

            using (MemoryStream ms = new MemoryStream())
            using (CryptoStream cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
            {
                cs.Write(inputBytes, 0, inputBytes.Length);
                cs.Close();
                return Convert.ToBase64String(ms.ToArray());
            }
        }
    }

    public static string Decrypt(string input)
    {
        byte[] byteKey = Encoding.UTF8.GetBytes(Key);
        byte[] byteIV = Encoding.UTF8.GetBytes(IV);
        byte[] inputBytes = Convert.FromBase64String(input);

        using (Aes aes = Aes.Create())
        {
            aes.Key = byteKey;
            aes.IV = byteIV;

            using (MemoryStream ms = new MemoryStream())
            using (CryptoStream cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Write))
            {
                cs.Write(inputBytes, 0, inputBytes.Length);
                cs.Close();
                return Encoding.UTF8.GetString(ms.ToArray());
            }
        }
    }

    public static class PasswordHelper
    {
        public static string HashPassword(string password, string salt)
        {
            using (var pbkdf2 = new Rfc2898DeriveBytes(password, Encoding.UTF8.GetBytes(salt), 100000, HashAlgorithmName.SHA256))
            {
                return Convert.ToBase64String(pbkdf2.GetBytes(20));
            }
        }

        public static string GenerateSalt()
        {
            var saltBytes = new byte[16];
            RandomNumberGenerator.Fill(saltBytes);
            return Convert.ToBase64String(saltBytes);
        }
    }

    public static string GeneratePermissionKey(string username, string groupname, UserType userType)
    {
        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        string key = $"{timestamp}:{username}:{groupname}:{userType}";

        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] bytes = Encoding.UTF8.GetBytes(key);
            byte[] hashBytes = sha256.ComputeHash(bytes);

            var permissionKey = new PermissionKeyModel
            {
                CreatedUsername = username,
                Groupname = groupname,
                UserType = userType,
                Timestamp = timestamp,
                Used = false
            };

            _permissionKeyDB.InsertOne(permissionKey);

            return Convert.ToBase64String(hashBytes);
        }
    }

    public static bool TryDecodePermissionKey(string permissionKey, out string username, out string groupname, out UserType userType)
    {
        username = null;
        groupname = null;
        userType = UserType.InActive;
        long timestamp = 0;

        try
        {
            byte[] hashBytes = Convert.FromBase64String(permissionKey);
            string decodedHash = Encoding.UTF8.GetString(hashBytes);
            string[] parts = decodedHash.Split(':');
            if (parts.Length != 4)
            {
                return false;
            }

            if (!long.TryParse(parts[0], out timestamp) || !Enum.TryParse(parts[3], out userType))
            {
                return false;
            }

            username = parts[1];
            groupname = parts[2];

            // Use the timestamp and username to query the DB
            var filter = Builders<PermissionKeyModel>.Filter.And(
                Builders<PermissionKeyModel>.Filter.Eq("Timestamp", timestamp),
                Builders<PermissionKeyModel>.Filter.Eq("CreatedUsername", username)
            );

            var storedPermissionKey = _permissionKeyDB.Find(filter).FirstOrDefault();
            if (storedPermissionKey == null)
            {
                return false;
            }

            if (!storedPermissionKey.Used)
            {
                // Update the permission key status as used
                _permissionKeyDB.UpdateOne(pk => pk.Id == storedPermissionKey.Id, Builders<PermissionKeyModel>.Update.Set(pk => pk.Used, true));
                return true;
            }
            else
            {
                return false; // Permission key already used
            }
        }
        catch (Exception)
        {
            return false;
        }
    }
}
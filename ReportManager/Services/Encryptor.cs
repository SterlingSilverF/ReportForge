using MongoDB.Bson;
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

    public static string GeneratePermissionKey(string username, string groupname, UserType userType, DateTime? expiration = null)
    {
        var permissionKey = new PermissionKeyModel
        {
            CreatedUsername = username,
            Groupname = groupname,
            UserType = userType,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            Expiration = expiration,
            Used = false
        };

        _permissionKeyDB.InsertOne(permissionKey);
        return permissionKey.Id.ToString();
    }


    public static bool VerifyPermissionKey(string keyString, out string groupname, out UserType userType)
    {
        groupname = null;
        userType = UserType.InActive;

        if (!ObjectId.TryParse(keyString, out ObjectId keyId))
        {
            return false;
        }

        var permissionKey = _permissionKeyDB.Find(pk => pk.Id == keyId).FirstOrDefault();
        if (permissionKey == null || permissionKey.Used || (permissionKey.Expiration.HasValue && permissionKey.Expiration < DateTime.UtcNow))
        {
            return false;
        }

        groupname = permissionKey.Groupname;
        userType = permissionKey.UserType;

        _permissionKeyDB.UpdateOne(pk => pk.Id == keyId, Builders<PermissionKeyModel>.Update.Set(pk => pk.Used, true));
        return true;
    }

    public static void ClearGroupKeys(string groupname)
    {
        if (_permissionKeyDB == null)
        {
            throw new InvalidOperationException("PermissionKey collection has not been initialized.");
        }

        var filter = Builders<PermissionKeyModel>.Filter.Eq(pk => pk.Groupname, groupname);
        _permissionKeyDB.DeleteMany(filter);
    }
}
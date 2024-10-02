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
    public static int KeySize { get; set; } = 256;
    public static int BlockSize { get; set; } = 128;

    public static void Initialize(IMongoCollection<PermissionKeyModel> permissionKeyDB)
    {
        _permissionKeyDB = permissionKeyDB;
    }

    private static void ValidateKeyAndIV(byte[] byteKey, byte[] byteIV)
    {
        if (byteKey.Length != KeySize / 8)
        {
            throw new ArgumentException($"Key size is incorrect. Expected {KeySize / 8} bytes, but got {byteKey.Length} bytes.");
        }

        if (byteIV.Length != BlockSize / 8)
        {
            throw new ArgumentException($"IV size is incorrect. Expected {BlockSize / 8} bytes, but got {byteIV.Length} bytes.");
        }
    }

    public static string Encrypt(string input)
    {
        if (string.IsNullOrEmpty(Key) || string.IsNullOrEmpty(IV))
        {
            throw new InvalidOperationException("Encryption key or IV is not set. Please check environment variables.");
        }

        byte[] byteKey = Convert.FromBase64String(Key);
        byte[] byteIV = Convert.FromBase64String(IV);
        byte[] inputBytes = Encoding.UTF8.GetBytes(input);

        ValidateKeyAndIV(byteKey, byteIV);

        using (Aes aes = Aes.Create())
        {
            aes.KeySize = KeySize;
            aes.BlockSize = BlockSize;
            aes.Key = byteKey;
            aes.IV = byteIV;

            using (MemoryStream ms = new MemoryStream())
            using (CryptoStream cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
            {
                cs.Write(inputBytes, 0, inputBytes.Length);
                cs.FlushFinalBlock();
                return Convert.ToBase64String(ms.ToArray());
            }
        }
    }

    public static string Decrypt(string input)
    {
        if (string.IsNullOrEmpty(Key) || string.IsNullOrEmpty(IV))
        {
            throw new InvalidOperationException("Encryption key or IV is not set. Please check environment variables.");
        }

        try
        {
            byte[] byteKey = Convert.FromBase64String(Key);
            byte[] byteIV = Convert.FromBase64String(IV);
            byte[] inputBytes = Convert.FromBase64String(input);

            ValidateKeyAndIV(byteKey, byteIV);

            using (Aes aes = Aes.Create())
            {
                aes.KeySize = KeySize;
                aes.BlockSize = BlockSize;
                aes.Key = byteKey;
                aes.IV = byteIV;

                using (MemoryStream ms = new MemoryStream())
                using (CryptoStream cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Write))
                {
                    cs.Write(inputBytes, 0, inputBytes.Length);
                    cs.FlushFinalBlock();
                    return Encoding.UTF8.GetString(ms.ToArray());
                }
            }
        }
        catch (CryptographicException ex)
        {
            throw new ApplicationException("Error decrypting data. The key or IV may be incorrect.", ex);
        }
        catch (FormatException ex)
        {
            throw new ApplicationException("Error decrypting data. The input string is not a valid Base64 string.", ex);
        }
        catch (Exception ex)
        {
            throw new ApplicationException("Unexpected error during decryption", ex);
        }
    }

    public static class PasswordHelper
    {
        public static string HashPassword(string password, string salt)
        {
            using (var pbkdf2 = new Rfc2898DeriveBytes(password, Encoding.UTF8.GetBytes(salt), 100000, HashAlgorithmName.SHA256))
            {
                return Convert.ToBase64String(pbkdf2.GetBytes(32));
            }
        }

        public static string GenerateSalt()
        {
            var saltBytes = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(saltBytes);
            }
            return Convert.ToBase64String(saltBytes);
        }
    }

    public static string GeneratePermissionKey(string username, string groupname, UserType userType, DateTime? expiration = null)
    {
        if (_permissionKeyDB == null)
        {
            throw new InvalidOperationException("PermissionKey collection has not been initialized.");
        }

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

        if (_permissionKeyDB == null)
        {
            throw new InvalidOperationException("PermissionKey collection has not been initialized.");
        }

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
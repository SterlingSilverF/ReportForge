using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ReportManager.Models
{
    public class BuiltConnectionString
    {
        public ObjectId Id { get; set; }
        public ObjectId ConnectionId { get; set; } // FK ServerConnectionModel.Id
        public string EncryptedConnectionString { get; set; }

        public BuiltConnectionString()
        {
            EncryptedConnectionString = string.Empty;
        }

        public void SetEncryptedConnectionString(string plainConnectionString)
        {
            EncryptedConnectionString = Encryptor.Encrypt(plainConnectionString);
        }

        public string GetDecryptedConnectionString()
        {
            return Encryptor.Decrypt(EncryptedConnectionString);
        }
    }
}

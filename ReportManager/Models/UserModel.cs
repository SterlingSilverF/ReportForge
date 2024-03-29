﻿using MongoDB.Bson;

namespace ReportManager.Models
{
    public class User
    {
        public ObjectId Id { get; set; }
        public string Username { get; set; }
        public string HashedPassword { get; set; }
        public string Salt { get; set; }
        public UserType UserType { get; set; } = UserType.ReadOnly;
        public string? Email { get; set; }
    }

    public enum UserType
    {
        InActive,
        ReadOnly,
        User,
        Developer,
        Admin
    }
}

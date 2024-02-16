class ServerConnectionModel {
    constructor() {
        this.id = ""; // ObjectId in MongoDB, but string representation in frontend
        this.serverName = "";
        this.port = 0;
        this.instance = ""; // Optional
        this.dbType = "";
        this.username = ""; // Optional
        this.password = ""; // Optional
        this.authType = "";
        this.ownerID = ""; // ObjectId in MongoDB, but string representation in frontend
        this.ownerType = ""; // Enum

        // MongoDB specific properties
        this.authSource = null; // Optional
        this.replicaSet = null; // Optional
        this.useTLS = null; // Optional boolean
    }
}
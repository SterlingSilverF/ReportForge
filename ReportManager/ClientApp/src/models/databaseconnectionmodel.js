import ServerConnectionModel from './serverconnectionmodel';

class DBConnectionModel {
    constructor() {
        this.serverConnection = new ServerConnectionModel();
        this.friendlyName = ""; // Optional
        this.databaseName = "";
    }
}
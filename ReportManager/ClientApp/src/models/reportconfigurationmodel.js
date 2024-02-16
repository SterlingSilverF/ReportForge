class ServerConnectionModel {
    constructor() {
        this.id = ""; // String representation of MongoDB ObjectId
        this.serverName = "";
        this.port = 0;
        this.instance = null;
        this.dbType = "";
        this.username = null;
        this.password = null;
        this.authType = "";
        this.ownerID = ""; // String representation of MongoDB ObjectId
        this.ownerType = ""; // Enum
        this.authSource = null;
        this.replicaSet = null;
        this.useTLS = null;
    }
}

class DBConnectionModel extends ServerConnectionModel {
    constructor() {
        super();
        this.friendlyName = null;
        this.databaseName = "";
    }
}

class ReportConfigurationModel {
    constructor() {
        this.id = ""; // String representation of MongoDB ObjectId
        this.reportName = "";
        this.description = null;
        this.sourceDB = new DBConnectionModel();
        this.schedule = new ScheduleInfo();
        this.reportJobs = []; // This will be an array of Job instances
        this.paginationLimit = 0;
        this.folderId = ""; // String representation of MongoDB ObjectId
        this.creatorId = ""; // String representation of MongoDB ObjectId
        this.createdDate = new Date();
        this.lastModifiedDate = new Date();
        this.lastModifiedBy = ""; // String representation of MongoDB ObjectId
        this.ownerID = ""; // String representation of MongoDB ObjectId
        this.ownerType = ""; // Assume you handle the enumeration as strings
    }
}

class CustomSQLReport extends ReportConfigurationModel {
    constructor() {
        super();
        this.customSQL = "";
    }
}

class NormalReportConfiguration extends ReportConfigurationModel {
    constructor() {
        super();
        this.selectedObjects = []; // This should contain instances of DatabaseObjectInfoModel
        this.columns = []; // This will be an array of ReportColumn instances
        this.filters = []; // This will be an array of Filter instances
        this.orderBy = [];
    }
}

class ReportColumn {
    constructor() {
        this.parentObject = {}; // Placeholder for DatabaseObjectInfoModel instance
        this.columnName = "";
        this.displayOrder = 0;
        this.columnFormatting = null; // Placeholder for ColumnFormatting instance
    }
}

class ColumnFormatting {
    constructor() {
        this.conversion = "None"; // Default conversion type
        this.formatValue = null;
        this.maxLength = null;
    }
}

class Filter {
    constructor() {
        this.operation = "Equals"; // Default operation
        this.columnName = "";
        this.values = [];
    }
}

class ScheduleInfo {
    constructor() {
        this.scheduleType = "Daily"; // Default schedule type
        this.iteration = 0;
        this.executeTime = "00:00"; // Time as a string in HH:MM format
    }
}

class Job {
    constructor() {
        this.scheduleInfo = new ScheduleInfo();
        this.reportFormat = "CSV"; // Default report format
    }
}

class EmailJob extends Job {
    constructor() {
        super();
        this.recipients = [];
    }
}

class FileTransferJob extends Job {
    constructor() {
        super();
        this.destination = "";
    }
}
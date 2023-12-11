import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Register from "./Pages/Register";
import RegisterAdmin from "./Pages/RegisterAdmin";
import Settings from "./Pages/Settings";
import Appearance from "./Pages/Appearance";
import UserManager from "./Pages/UserManager";
import GroupManager from "./Pages/GroupManager";
import Metrics from "./Pages/Metrics";
import BrowseReports from "./Pages/BrowseReports";
import Reports from "./Pages/Reports";
import Groups from "./Pages/Groups";
import GroupInformation from "./Pages/GroupInformation";
import CreateGroup from "./Pages/CreateGroup";
import ModifyGroup from "./Pages/ModifyGroup";
import CreateFolder from "./Pages/CreateFolder";
import CreateReport from "./Pages/CreateReport";
import GroupConnections from "./Pages/GroupConnections";
import ConnectionForm from "./Pages/ConnectionForm";

/* DB Icons */
import mssql from './components/mssql.png';
import oracle from './components/oracle.png';
import mysql from './components/mysql.png';
import postgres from './components/postgres.png';
import mongodb from './components/mongoDB.png';
import DB2 from './components/DB2_IBM.png';
import UserManagement from "./Pages/UserManager";

const dbIcons = {
    mssql,
    oracle,
    mysql,
    postgres,
    mongodb,
    DB2
};

const AppRoutes = [
    {
        path: '/',
        element: <Dashboard dbIcons={dbIcons} />
    },
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/register',
        element: <Register />
    },
    {
        path: '/registeradmin',
        element: <RegisterAdmin />
    },
    {
        path: '/settings',
        element: <Settings />
    },
    {
        path: '/appearance',
        element: <Appearance />
    },
    {
        path: '/usermanager',
        element: <UserManager />
    },
    {
        path: '/groupmanager',
        element: <GroupManager />
    },
    {
        path: '/metrics',
        element: <Metrics />
    },
    {
        path: '/browse_reports',
        element: <BrowseReports />
    },
    {
        path: '/reports',
        element: <Reports />
    },
    {
        path: '/groups',
        element: <Groups />
    },
    {
        path: '/groupinformation',
        element: <GroupInformation />
    },
    {
        path: '/groupconnections',
        element: <GroupConnections />
    },
    {
        path: '/creategroup',
        element: <CreateGroup />
    },
    {
        path: '/modifygroup',
        element: <ModifyGroup />
    },
    {
        path: '/connectionform',
        element: <ConnectionForm />
    },
    {
        path: '/createfolder',
        element: <CreateFolder />
    },
    {
        path: '/creategroup',
        element: <CreateGroup />
    }
];

export default AppRoutes;
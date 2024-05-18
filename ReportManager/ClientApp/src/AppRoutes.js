import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Register from "./Pages/Register";
import RegisterAdmin from "./Pages/RegisterAdmin";
import Settings from "./Pages/Settings";
import Appearance from "./Pages/Appearance";
import UserManager from "./Pages/UserManager";
import GroupManager from "./Pages/GroupManager";
import Metrics from "./Pages/Metrics";
import Reports from "./Pages/Reports";
import Groups from "./Pages/Groups";
import Connections from "./Pages/Connections";
import Browse from "./Pages/Browse";
import GroupForm from "./Pages/GroupForm";
import GroupInformation from "./Pages/GroupInformation";
import ReportInformation from "./Pages/ReportInformation";
import ConnectionForm from "./Pages/ConnectionForm";
import UserManagement from "./Pages/UserManager";
import FolderForm from "./Pages/FolderForm";
import ReportForm from "./Pages/ReportForm";
import ReportDesigner from "./Pages/ReportDesigner";
import PreviewReport from "./Pages/PreviewReport";
import ReportConfig from "./Pages/ReportConfig";
import AllGuides from "./Pages/guides/AllGuides";
import WorkspaceGuides from "./Pages/guides/WorkSpaceGuides";
import AddingNewContentGuides from "./Pages/guides/AddingNewContentGuides";
import EditingExistingContentGuides from "./Pages/guides/EditingExistingContentGuides";
import DatabasesGuides from "./Pages/guides/DatabaseGuides";
import ReportsGuides from "./Pages/guides/ReportGuides";
import CapstoneMaterials from "./Pages/guides/CapstoneMaterials";

/* DB Icons */
import mssql from './components/Images/mssql.png';
import oracle from './components/Images/oracle.png';
import mysql from './components/Images/mysql.png';
import postgres from './components/Images/postgres.png';
import mongodb from './components/Images/mongoDB.png';
import DB2 from './components/Images/DB2_IBM.png';

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
        element: <Dashboard dbIcons={dbIcons} />,
        includeNavbar: true
    },
    {
        path: '/browse',
        element: <Browse />,
        includeNavbar: true
    },
    {
        path: '/login',
        element: <Login />,
        includeNavbar: false
    },
    {
        path: '/register',
        element: <Register />,
        includeNavbar: false
    },
    {
        path: '/registeradmin',
        element: <RegisterAdmin />,
        includeNavbar: false
    },
    {
        path: '/settings',
        element: <Settings />,
        includeNavbar: true
    },
    {
        path: '/appearance',
        element: <Appearance />,
        includeNavbar: true
    },
    {
        path: '/usermanager',
        element: <UserManager />,
        includeNavbar: true
    },
    {
        path: '/groupmanager',
        element: <GroupManager />,
        includeNavbar: true
    },
    {
        path: '/metrics',
        element: <Metrics />,
        includeNavbar: true
    },
    {
        path: '/reports',
        element: <Reports />,
        includeNavbar: true
    },
    {
        path: '/groups',
        element: <Groups />,
        includeNavbar: true
    },
    {
        path: '/connections',
        element: <Connections dbIcons={dbIcons} />,
        includeNavbar: true
    },
    {
        path: '/groupinformation',
        element: <GroupInformation />,
        includeNavbar: true
    },
    {
        path: '/reportinformation',
        element: <ReportInformation />,
        includeNavbar: true
    },
    {
        path: '/groupform',
        element: <GroupForm />,
        includeNavbar: true
    },
    {
        path: '/connectionform',
        element: <ConnectionForm />,
        includeNavbar: true
    },
    {
        path: '/folderform',
        element: <FolderForm />,
        includeNavbar: true
    },
    {
        path: '/reportform',
        element: <ReportForm />,
        includeNavbar: true
    },
    {
        path: '/reportdesigner',
        element: <ReportDesigner />,
        includeNavbar: true
    },
    {
        path: '/previewreport',
        element: <PreviewReport />,
        includeNavbar: true
    },
    {
        path: '/reportconfig',
        element: <ReportConfig />,
        includeNavbar: true
    },
    {
        path: '/guides/allguides',
        element: <AllGuides />,
        includeNavbar: true
    },
    {
        path: '/guides/workspace',
        element: <WorkspaceGuides />,
        includeNavbar: true
    },
    {
        path: '/guides/adding-new-content',
        element: <AddingNewContentGuides />,
        includeNavbar: true
    },
    {
        path: '/guides/editing-existing-content',
        element: <EditingExistingContentGuides />,
        includeNavbar: true
    },
    {
        path: '/guides/databases',
        element: <DatabasesGuides dbIcons={dbIcons} />,
        includeNavbar: true
    },
    {
        path: '/guides/reports',
        element: <ReportsGuides />,
        includeNavbar: true
    },
    {
        path: '/guides/capstone-materials',
        element: <CapstoneMaterials />,
        includeNavbar: true
    },
];

export default AppRoutes;
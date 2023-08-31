import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Register from "./Pages/Register";
import RegisterAdmin from "./Pages/RegisterAdmin";
import Settings from "./Pages/Settings";
import Groups from "./Pages/Groups";
import GroupFolders from "./Pages/GroupFolders";
import CreateGroup from "./Pages/CreateGroup";
import ModifyGroup from "./Pages/ModifyGroup";
import GroupConnections from "./Pages/GroupConnections";
import CreateConnection from "./Pages/CreateConnection";
import { Counter } from "./components/Counter";

const AppRoutes = [
    {
        path: '/',
        element: <Dashboard />
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
        path: '/groups',
        element: <Groups />
    },
    {
        path: '/groupfolders',
        element: <GroupFolders />
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
        path: '/createconnection',
        element: <CreateConnection />
    },
    {
        path: '/counter',
        element: <Counter />
    }
];

export default AppRoutes;
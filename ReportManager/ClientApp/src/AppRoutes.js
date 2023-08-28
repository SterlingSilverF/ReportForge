import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Register from "./Pages/Register";
import RegisterAdmin from "./Pages/RegisterAdmin";
import Settings from "./Pages/Settings";
import Groups from "./Pages/Groups";
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
        path: '/counter',
        element: <Counter />
    }
];

export default AppRoutes;
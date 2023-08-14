import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Register from "./Pages/Register";
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
        path: '/counter',
        element: <Counter />
    }
];

export default AppRoutes;
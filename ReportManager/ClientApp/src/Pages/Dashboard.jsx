import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Assuming you store your token in localStorage, adjust as needed
        const token = localStorage.getItem('token');
        console.log("Token:", token);

        if (!token) {
            navigate('/login');
        }

        // TODO: Optionally, you can also verify the token with your backend here
        // to make sure it's valid and not expired.

    }, [navigate]);

    return (
        <div>
            <h1>Welcome to the Dashboard</h1>
            
        </div>
    );
};

export default Dashboard;
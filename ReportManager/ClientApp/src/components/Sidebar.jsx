import React from 'react';
import HOC from '../components/HOC';

const Sidebar = ({ env, username, navigate }) => {
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    }

    return (
        <div className="header">
            <h3>Welcome, {username}</h3>
            <p className="rpf-gold">Environment: {env}</p>
            <button className="btn-seven" to="/login" onClick={handleLogout}>Sign Out</button>
        </div>
    );
};

export default HOC(Sidebar);
import React from 'react';
import HOC from '../components/HOC';

const Sidebar = ({ env, username, navigate }) => {
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    }

    return (
        <div className="sidebar">
            <h5>Welcome, {username}</h5>
            <p className="rpf-gold">Environment: {env}</p>
            <button className="btn-seven" onClick={handleLogout}>Sign Out</button>
            <h4 style={{ marginTop: "250%" }}>Guides</h4>
            <a href="/guides/allguides">All Guides</a><br /><br />
            <p style={{ color: "white" }}>Frequently Used</p>
            <a href="/guides/adding-new-content#creating-a-connection">Adding a New Connection</a><br />
            <a href="/guides/adding-new-content#creating-a-report">Creating a Report</a><br />
            <a href="/guides/editing-existing-content#managing-groups">Managing Groups</a>
        </div>
    );
};

export default HOC(Sidebar);
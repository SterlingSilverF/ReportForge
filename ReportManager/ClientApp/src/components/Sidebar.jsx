import React from 'react';
import HOC from '../components/HOC';

const Sidebar = ({ env, username, navigate }) => {
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    }

    return (
        <div className="sidebar">
            <h4>Welcome, {username}</h4>
            <p className="rpf-gold">Environment: {env}</p>
            <button className="btn-seven" to="/login" onClick={handleLogout}>Sign Out</button>
            <br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br/>
            <h4>Guides</h4>
            <a href="/guide/report-creation">All Guides</a><br /><br />
            <p>Frequently Used</p>
            <a href="/guide/adding-connection">Adding a New Connection</a><br/>
            <a href="/guide/report-creation">Creating a Report</a><br />
            <a href="/guide/managing-groups">Managing Groups</a>
            {/* TODO: Add more guides and corresponding sections in the application */}
        </div>
    );
};

export default HOC(Sidebar);
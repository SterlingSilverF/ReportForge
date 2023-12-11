import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

const UserManager = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log("Token:", token);

        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <div id="app-admin">
            <div className="header">
                <h4 className="centered-content">App Settings</h4>
                <nav class="main-nav">
                    <ul class="unstyled list-hover-slide">
                        <li><a href="/settings">Account</a></li>
                        <li><a href="/appearance">Appearance</a></li>
                        <li className="selected-nav"><a href="/usermanager">User Management</a></li>
                        <li><a href="/groupmanager">Group Management</a></li>
                        <li><a href="/metrics">Metrics</a></li>
                    </ul>
                </nav>
            </div>
            <main className="box-style-1">
                <h4>Manage Users</h4>
                <br /><br />

            </main>
        </div>
    );
};

export default UserManager;
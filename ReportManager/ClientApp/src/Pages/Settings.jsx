import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

const Settings = () => {
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
                        <li className="selected-nav"><a href="/settings">Account</a></li>
                        <li><a href="/appearance">Appearance</a></li>
                        <li><a href="/usermanager">User Management</a></li>
                        <li><a href="/groupmanager">Group Management</a></li>
                        <li><a href="/metrics">Metrics</a></li>
                    </ul>
                </nav>
            </div>
            <main className="box-style-1">
                <h4>Basic Information</h4>
                <FontAwesomeIcon icon={faEdit} className="clickable rpf-black" />
                <br /><br />
                <h5>Username</h5>
                <input disabled></input>
                <br /><br />
                <h5>Email</h5>
                <input disabled></input>
                <br /><br />
                <h5>Account Type:</h5>
                <p className="rpf-red">Administrator</p><br />
                <label>Current Password</label><br />
                <input id="current-pass"></input><br /><br />
                <label>New Password</label><br />
                <input id="new-pass"></input>
                <input id="new-pass-confirm"></input><br />
                <button className="btn-six">Change Password</button>
                <br /><br /><br />
                <button className="btn-five">Clear Reports</button>
                <button className="btn-five">Clear Connections</button>
                <br /><br /><br />
                <button className="btn-five">Delete Account</button>
            </main>
        </div>
    );
};

export default Settings;
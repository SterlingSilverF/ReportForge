import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FirstTimeAdminSetup = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [groupname, setGroupname] = useState('');
    const [email, setEmail] = useState('');
    const [permissionKey, setPermissionKey] = useState('');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    axios.defaults.baseURL = 'https://localhost:7280';

    const canSubmit = username.length >= 3 && password.length >= 8 && password === confirmPassword && groupname != "";

    const handleSuccess = () => {
        setSuccess(true);
        setMessage('First time setup completed without errors.');
    };

    const handleError = (err) => {
        setSuccess(false);
    };

    const resetForm = () => {
        window.location.reload();
    };

    const handleAdminSetup = async (e) => {
        e.preventDefault();

        if (canSubmit) {
            axios.post('/api/auth/firsttimesetup', {
                username,
                password,
                groupname,
                email,
                permission_key: permissionKey
            })
                .then(response => {
                    handleSuccess();
                })
                .catch(error => {
                    console.log(error);
                    handleError(error);
                });
        } else {
            setMessage("Form input is incorrect or invalid.");
        }
    };

    return (
        <div className='form-div'>
            <h3><strong>First-Time Admin Setup</strong></h3>
            <form onSubmit={handleAdminSetup}>
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />

                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />

                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                />

                <label htmlFor="groupname">Group Name</label>
                <input
                    type="text"
                    id="groupname"
                    value={groupname}
                    onChange={e => setGroupname(e.target.value)}
                />

                <label htmlFor="email">Email (Optional)</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />

                <label htmlFor="permissionKey">Activation Key</label>
                <input
                    type="text"
                    id="permissionKey"
                    value={permissionKey}
                    onChange={e => setPermissionKey(e.target.value)}
                />
                <br /><br />
                <input
                    type="submit"
                    value="Setup Admin"
                    className="btn btn-block"
                    disabled={!canSubmit}
                />
            </form>
            <p className="success-message">{message}</p>
            {success && (
                <div>
                    <button onClick={() => navigate('/')} className="btn-four">Go to Dashboard</button>
                    <button onClick={resetForm} className="btn-four">Reset Form</button><br />
                </div>
            )}
        </div>
    );
};

export default FirstTimeAdminSetup;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HOC from '../components/HOC';

const Register = ({ navigate, makeApiRequest }) => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [permissionKey, setPermissionKey] = useState('');
    const [message, setMessage] = useState('');

    const canSubmit = username.length >= 3 && password.length >= 8;

    const handleRegister = async (e) => {
        e.preventDefault();

        if (canSubmit) {
            makeApiRequest('post', '/api/auth/register', {
                username,
                password,
                email,
                permission_key: permissionKey
            })
                .then(response => {
                    setMessage("Registration successful.")
                })
                .catch(error => {
                    console.log(error);
                    setMessage("An error was encountered during registration. Please try again or contact your administrator.")
                });
        } else {
            console.log("Invalid form data");
        }
    };

    return (
        <div className='form-div'>
            <h3><strong>Register</strong></h3>
            <form onSubmit={handleRegister}>
                <div className="tooltipcon">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        placeholder="Your_Display_Name"
                        autoComplete="off"
                        id="username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    <span className="tooltiptext">Minimum 3 characters, no spaces or special characters</span>
                </div>
                <div className="tooltipcon">
                    <label htmlFor="password2">Password</label>
                    <input
                        type="password"
                        id="password"
                        autoComplete="off"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <span className="tooltiptext">Minimum 8 characters</span>
                </div>
                <div className="tooltipcon">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        autoComplete="off"
                    />
                    <span className="tooltiptext">Type it again, for good measure.</span>
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
                <div className="tooltipcon">
                    <label htmlFor="permissionKey">Permission Key</label>
                    <input
                        type="text"
                        id="permissionKey"
                        className="form-control"
                        autoComplete="off"
                        value={permissionKey}
                        onChange={e => setPermissionKey(e.target.value)}
                    />
                    <span className="tooltiptext">Provided by a group owner or app administrator.</span>
                </div><br /><br />
                <input
                    type="submit"
                    value="Register"
                    className="btn-one btn-block"
                    disabled={!canSubmit}
                />
            </form>
            <p className="success-message">{message}</p>
        </div>
    );
};

export default HOC(Register, false);
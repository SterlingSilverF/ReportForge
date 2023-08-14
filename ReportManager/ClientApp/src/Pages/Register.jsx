import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [groupName, setGroupName] = useState('');

    axios.defaults.baseURL = 'https://localhost:7280';

    const handleRegister = async (e) => {
        e.preventDefault();

        axios.post('/api/auth/register', {
            username: username,
            password: password,
            groupName: groupName,
        })
            .then(response => {
                console.log("Registration successful");
            })
            .catch(error => {
                console.log(error);
            });
    };

    return (
        <div className='form-div'>
            <h3><strong>Register</strong></h3>
            <form onSubmit={handleRegister}>
                <div>
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="your-email@gmail.com"
                        autoComplete="off"
                        id="username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Your Password"
                        id="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="groupName">Group Name</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Ex. DOMAIN.COM"
                        id="groupName"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                    />
                </div>
                <div>
                <br></br>
                    <a href="#" className="forgot-pass">Already Registered? Log In</a>
                </div>
                <input type="submit" value="Register" className="btn btn-block btn-primary" />
            </form>
        </div>
    );
};

export default Register;
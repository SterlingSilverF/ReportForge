import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isManualAuthVisible, setIsManualAuthVisible] = useState(false);
    const [loginError, setLoginError] = useState('');
    const navigate = useNavigate();

    axios.defaults.baseURL = 'https://localhost:7280';

    useEffect(() => {
        tryWindowsAuth();
    }, []);

    const tryWindowsAuth = async () => {
        try {
            await axios.get('/api/auth/windows-auth');
        } catch (error) {
            // If Windows Authentication fails, show the manual login form
            setIsManualAuthVisible(true);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        axios.post('/api/auth/login', {
            username: username,
            password: password
        })
            .then(response => {
                console.log("Login successful");
                localStorage.setItem('token', response.data.token);
                navigate('/');
            })
            .catch(error => {
                if (error.response && error.response.status === 401) {
                    setLoginError('Username and password combination not found.');
                }
                else {
                    setLoginError('Something went wrong. Check server logs.');
                    // TODO: log here
                }
            });
    };

    return (
        <div className='form-div'>
            <h3><strong>Sign In</strong></h3>
            {loginError && <div className="error-message">{loginError}</div>}
            {isManualAuthVisible && (
                <form onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            placeholder="your-email@domain.com"
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
                            placeholder="Your Password"
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <br></br>
                    <input type="submit" value="Log In" className="btn-one btn-block btn-primary" />
                    <div className="link-container">
                        <a href="/Register" className="forgot-pass">Register</a>
                        <a href="#" className="forgot-pass">Forgot Password</a>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Login;
import React, { useState, useEffect } from 'react';
import HOC from '../components/HOC';

const Login = ({ navigate, makeApiRequest, token }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isManualAuthVisible, setIsManualAuthVisible] = useState(false);
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        tryWindowsAuth();
    }, []);

    const tryWindowsAuth = async () => {
        try {
            await makeApiRequest('get', '/api/auth/windows-auth');
            if (token) {
                navigate('/');
            }
        } catch (error) {
            setIsManualAuthVisible(true);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        makeApiRequest('post', '/api/auth/login', {
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
                            autoComplete="on"
                            id="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <br />
                    <input type="submit" value="Log In" className="btn-one" />
                    <div className="link-container">
                        <a href="/register" className="rpf-silverblue">Register</a>
                        <a href="#" className="rpf-silverblue">Forgot Password</a>
                    </div>
                </form>
            )}
        </div>
    );
};

export default HOC(Login, false);
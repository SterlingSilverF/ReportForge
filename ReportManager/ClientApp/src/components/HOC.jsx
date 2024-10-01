import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

/* 
HOC (Higher Order Component)
Last Updated on 9/30/2024
*/
const HOC = (WrappedComponent, requireAuth = true) => {
    return function Shared(props) {
        // Common state variables
        const [env, setEnv] = useState('Development');
        const navigate = useNavigate();
        axios.defaults.baseURL = 'https://localhost:7280';
        const [token, setToken] = useState(localStorage.getItem('token'));
        const [username, setUsername] = useState('');
        const [userID, setUserID] = useState('');

        useEffect(() => {
            if (requireAuth) {
                if (!token) {
                    navigate('/login');
                } else {
                    try {
                        const decoded = jwt_decode(token);
                        setUsername(decoded.sub);
                        setUserID(decoded.UserId);
                    } catch (error) {
                        // If the token is invalid, redirect to login
                        console.error('Error decoding token:', error);
                        navigate('/login');
                    }
                }
            }
        }, [navigate, token, requireAuth]);

        const makeApiRequest = (method, endpoint, data = null) => {
            return axios({
                method: method,
                url: endpoint,
                data: data,
                headers: { 'Authorization': `Bearer ${token}` }
            });
        };

        const goBack = () => {
            navigate(-1);
        };

        const resetForm = () => {
            window.location.reload();
        };

        return <WrappedComponent
            {...props}
            env={env}
            navigate={navigate}
            username={username}
            userID={userID}
            makeApiRequest={makeApiRequest}
            goBack={goBack}
        />;
    }
}

export default HOC;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

/* 
HOC (Higher Order Component)
Last Updated on 12/10/2023
*/
const HOC = (WrappedComponent) => {
    return function Shared(props) {
        // Common state variables
        const [env, setEnv] = useState('');
        const navigate = useNavigate();
        axios.defaults.baseURL = 'https://localhost:7280';
        const [token, setToken] = useState(localStorage.getItem('token'));
        const [username, setUsername] = useState('');
        const [userID, setUserID] = useState('');

        useEffect(() => {
            if (!token) {
                navigate('/login');
            } else {
                // TODO: setenv
                setEnv('Production');
                const decoded = jwt_decode(token);
                setUsername(decoded.sub);
                setUserID(decoded.UserId);
            }
        }, [navigate, token]);

        const makeApiRequest = (method, endpoint, data = null) => {
            return axios({
                method: method,
                url: endpoint,
                data: data,
                headers: { 'Authorization': `Bearer ${token}` }
            });
        };

        const validateForm = (formData, validationRules) => {
            let isValid = true;
            let errors = {};

            const requiredFields = validationRules.requiredFields || [];
            requiredFields.forEach(field => {
                if (!formData[field] || formData[field].toString().trim() === '') {
                    isValid = false;
                    errors[field] = 'This field is required';
                }
            });

            for (const field in validationRules) {
                if (field === 'requiredFields') continue;
                if (validationRules.hasOwnProperty(field)) {
                    const value = formData[field];
                    const rules = validationRules[field];

                    if (rules.type && typeof value !== rules.type) {
                        isValid = false;
                        errors[field] = `Expected type ${rules.type}, but got ${typeof value}`;
                    }

                    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
                        isValid = false;
                        errors[field] = `Value must be one of the following: ${rules.allowedValues.join(', ')}`;
                    }
                }
            }
            return { isValid, errors };
        };

        const resetForm = () => {
            window.location.reload();
        };

        return <WrappedComponent
            {...props}
            env={env}
            token={token}
            navigate={navigate}
            username={username}
            userID={userID}
            makeApiRequest={makeApiRequest}
            validateForm={validateForm}
        />;
    }
}

export default HOC;
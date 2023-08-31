import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';

const ModifyConnection = () => {
    const [connectionName, setConnectionName] = useState('');
    const [hostname, setHostname] = useState('');
    const [port, setPort] = useState('');
    const [env, setEnv] = useState('');
    const navigate = useNavigate();
    const { connectionId } = useParams(); // Assuming you're passing connectionId as a URL parameter

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            const decoded = jwt_decode(token);
            setEnv('Production');

            // Fetch existing connection details
            axios.get(`/api/Connection/getConnection/${connectionId}`)
                .then(response => {
                    setConnectionName(response.data.connectionName);
                    setHostname(response.data.hostname);
                    setPort(response.data.port);
                })
                .catch(error => {
                    console.error('Could not fetch connection:', error);
                });
        }
    }, [navigate, connectionId]);

    const handleUpdateConnection = () => {
        axios.post('/api/Connection/updateConnection', {
            connectionName,
            hostname,
            port,
            connectionId
        })
            .then(() => {
                alert('Connection successfully updated.');
            })
            .catch(error => {
                console.error('Could not update connection:', error);
            });
    };

    return (
        <div className="sub-container">
            <div className="header">
                <h1>Modify Connection</h1>
                <p>Environment: {env}</p>
            </div>
            <div className="form-section">
                <label>Connection Name</label>
                <input type="text" value={connectionName} onChange={(e) => setConnectionName(e.target.value)} className="input-style" />

                <label>Hostname</label>
                <input type="text" value={hostname} onChange={(e) => setHostname(e.target.value)} className="input-style" />

                <label>Port</label>
                <input type="text" value={port} onChange={(e) => setPort(e.target.value)} className="input-style" />
            </div>

            <button onClick={handleUpdateConnection} className="btn-two">Update Connection</button>
        </div>
    );
};

export default ModifyConnection;

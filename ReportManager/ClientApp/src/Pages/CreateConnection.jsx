import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const CreateConnection = () => {
    const [connectionName, setConnectionName] = useState('');
    const [hostname, setHostname] = useState('');
    const [port, setPort] = useState('');
    const [connectionId, setConnectionId] = useState(null);
    const navigate = useNavigate();
    const [env, setEnv] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            const decoded = jwt_decode(token);
            setEnv('Production');
        }
    }, [navigate]);

    const handleCreateConnection = () => {
        axios.post('/api/Connection/createConnection', {
            connectionName,
            hostname,
            port
        })
            .then(response => {
                setConnectionId(response.data.connectionId);  // Assuming connectionId is in response.data.connectionId
            })
            .catch(error => {
                console.error('Could not create connection:', error);
            });
    };

    return (
        <div className="sub-container">
            <div className="header">
                <h1>Create New Connection</h1>
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

            <button onClick={handleCreateConnection} className="btn-two">Create Connection</button>

            {connectionId && <label className="success-label">Connection successfully created. <a onClick={() => navigate(`/ModifyConnection/${connectionId}`)}>Go to Modify Connection</a></label>}
        </div>
    );
};

export default CreateConnection;
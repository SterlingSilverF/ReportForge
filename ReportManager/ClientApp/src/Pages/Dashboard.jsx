import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
    const navigate = useNavigate();
    const [env, setEnv] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            setEnv('Production');
        }
    }, [navigate]);

    return (
        <div className="dashboard-container">
            <div className="sub-container">
                <div className="header">
                    <h1>Welcome to the Dashboard</h1>
                    <p>Enviornment: {env}</p>
                </div>
                <div className="options-section">
                    <section className="get-started">
                        <h2>Get Started</h2>
                        <hr></hr>
                        <div className="inline-buttons">
                            <button className="btn-two">Add a new connection</button>
                            <button className="btn-two">Create a new report</button>
                            <button className="btn-two">Create a new folder</button>
                            <button className="btn-two">Create a new group</button>
                        </div>
                    </section>
                    <br/><br/><br/>
                    <section className="box">
                        <h3>My folders</h3>
                        <hr></hr>
                        <div className="image-label-pair">
                            <FontAwesomeIcon icon={faFolder} size="5x" className="folder"/>
                            <label>Some Text</label>
                        </div>
                    </section>
                    <section className="box">
                        <h3>My reports</h3>
                        <hr></hr>
                    </section>
                    <section className="box">
                        <h3>My connections</h3>
                        <hr></hr>
                    </section>
                </div>
            </div>
            <div className="sub-container">
                <h3>Recently ran reports</h3>
                <hr></hr>
            </div>
        </div>
    );
};

export default Dashboard;
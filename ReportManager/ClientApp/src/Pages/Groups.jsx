import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/free-solid-svg-icons';


const UserGroups = ({ }) => {
    const [groups, setGroups] = useState([]);

    axios.defaults.baseURL = 'https://localhost:7280';
    const token = localStorage.getItem('token');
    const decoded = jwt_decode(token);
    //console.log('Decoded JWT:', decoded);
    const userId = decoded.UserId;
    const usernameFromToken = decoded.sub;

    useEffect(() => {
        axios.get(`/api/Group/getUserGroups?id=${userId}`)
            .then(response => {
                setGroups(response.data);
            })
            .catch(error => {
                console.error('There was an error!', error);
            });
    }, [userId]);

    return (
        <div className="dashboard-container">
            <div className="options-section">
                <div className="header">Your Groups</div>
                {groups.map((group, index) => (
                    <div key={index}>
                        <div className="image-label-pair">
                            <FontAwesomeIcon icon={faFolder} size="6x" className="folder" onClick={() => navigate('/groups/')/>
                            <label className="rpf-red">{group.groupName}</label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserGroups;
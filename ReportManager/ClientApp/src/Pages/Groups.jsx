import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';

const Groups = ({ }) => {
    axios.defaults.baseURL = 'https://localhost:7280';
    const [userGroups, setUserGroups] = useState([]);
    const token = localStorage.getItem('token');
    const decoded = jwt_decode(token);
    const userId = decoded.UserId;
    const navigate = useNavigate();

    useEffect(() => {
        console.log(token);
        axios.get(`/api/group/getUserGroups?username=${decoded.sub}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                setUserGroups(response.data);
            })
            .catch(error => {
                console.error('Could not fetch user groups:', error);
            });
    }, [token, decoded.sub]);

    return (
        <div className="sub-container">
            <div className="title-style-two grid-item">Your Groups</div>
            <div className="padding-medium grid-container">
                {userGroups.map((group, index) => {
                    return (
                        <div key={index} className="image-label-pair grid-item hover-icon clickable" onClick={() => navigate(`/groupinformation?groupId=${group.id}`)}>
                            <FontAwesomeIcon
                                icon={faUsers}
                                size="4x"
                            />
                            <label className="group-name">
                                {group.groupName}
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Groups;
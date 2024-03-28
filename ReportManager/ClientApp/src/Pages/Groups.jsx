import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faUsers } from '@fortawesome/free-solid-svg-icons';
import HOC from '../components/HOC';

const Groups = ({ makeApiRequest, username, navigate }) => {
    const [userGroups, setUserGroups] = useState([]);

    useEffect(() => {
        if (username) {
            makeApiRequest('get', `/api/group/getUserGroups?username=${username}`)
                .then(response => {
                    setUserGroups(response.data);
                })
                .catch(error => {
                    console.error('Could not fetch user groups:', error);
                });
        }
    }, [username, makeApiRequest]);

    return (
        <div className="sub-container">
            <div className="title-style-two grid-item">Your Groups</div>
            <div className="padding-medium grid-container">
                {userGroups.map((group, index) => (
                    <div key={index} className="image-label-pair grid-item hover-icon clickable" onClick={() => navigate(`/groupinformation?groupId=${group.id}`)}>
                        <FontAwesomeIcon
                            icon={faUsers}
                            size="4x"
                        />
                        <label className="group-name">
                            {group.groupName}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default HOC(Groups);
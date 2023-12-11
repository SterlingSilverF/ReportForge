import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';
import DualListBox from 'react-dual-listbox';
import 'react-dual-listbox/lib/react-dual-listbox.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { } from '@fortawesome/free-solid-svg-icons';

const ModifyGroup = () => {
    const [groupname, setGroupName] = useState('');
    const [userGroups, setUserGroups] = useState([]);
    const [username, setUserName] = useState('');
    const [usernames, setUsernames] = useState([]);
    const [selectedOwners, setSelectedOwners] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [parentGroupId, setParentGroupId] = useState(null);
    const [adminId, setAdminId] = useState('');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [groupId, setGroupId] = useState(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const navigate = useNavigate();
    const { id } = useParams();
    axios.defaults.baseURL = 'https://localhost:7280';

    const resetForm = () => {
        window.location.reload();
    };

    useEffect(() => {
        if (id) {
            axios.get(`/api/group/getGroup/${id}`)
                .then(response => {
                    const groupData = response.data;
                    setGroupId(groupData.id);
                    setGroupName(groupData.groupname);
                    setSelectedOwners(groupData.owners);
                    setSelectedMembers(groupData.members);
                    setParentGroupId(groupData.parentGroupId);
                    setIsDataLoaded(true);
                })
                .catch(error => {
                    console.error('Error fetching group data:', error);
                });
        }
    }, [id]);

    const handleEditGroup = () => {
        if (groupId && groupname && username && parentGroupId) {
            axios.put(`/api/group/updateGroup/${groupId}`, {
                groupname,
                username,
                parentGroupId,
                selectedOwners,
                selectedMembers
            })
                .then(response => {
                    // Handle success
                })
                .catch(error => {
                    // Handle error
                });
        } else {
            // Handle validation error
        }
    };

    const options = usernames.map(username => ({ value: username, label: username }));

    return (
        <div className="sub-container outer">
            <div className="form-header">
                <h2>Edit Group</h2>
            </div>
            {isDataLoaded ? (
                <section className="box form-box">
                    <div className="form-element">
                        <label>Group Name</label><br />
                        <input
                            type="text"
                            value={groupname}
                            onChange={e => setGroupName(e.target.value)}
                            className="input-style"
                        />
                    </div>
                    <div className="form-element">
                        <label>Underneath Group:</label><br />
                        <select
                            value={parentGroupId}
                            onChange={e => setParentGroupId(e.target.value)}
                            className="input-style standard-select"
                            style={{ fontSize: "1em" }}
                        >
                            {userGroups.map(group => (
                                <option key={group.id} value={group.id}>{group.groupName}</option>
                            ))}
                        </select>
                    </div>
                    <br />
                    <section>
                        <label>Group Owners</label>
                        <DualListBox
                            options={options}
                            selected={selectedOwners}
                            onChange={(selected) => setSelectedOwners(selected)}
                            canFilter
                        />
                        <br /><br />
                        <label>Group Members</label>
                        <DualListBox
                            options={options}
                            selected={selectedMembers}
                            onChange={(selected) => setSelectedMembers(selected)}
                            canFilter
                        />
                    </section>
                    <br /><br />
                    <button onClick={handleEditGroup} className="btn-three">Update Group</button><br />
                    <label className="result-label"></label>
                    <p className="success-message">{message}</p>
                </section>
            ) : (
                <p>Loading group data...</p>
            )}
            {success && (
                <div>
                    <button onClick={() => navigate('/')} className="btn-four inline-pad">Go to Dashboard</button>
                    <button onClick={resetForm} className="btn-four">Reset Form</button><br />
                </div>
            )}
        </div>
    );
}

export default ModifyGroup;
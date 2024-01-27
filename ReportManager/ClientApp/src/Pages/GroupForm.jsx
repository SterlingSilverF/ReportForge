import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import DualListBox from 'react-dual-listbox';
import 'react-dual-listbox/lib/react-dual-listbox.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { } from '@fortawesome/free-solid-svg-icons';

const GroupForm = () => {
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

    const navigate = useNavigate();
    const [env, setEnv] = useState('');
    axios.defaults.baseURL = 'https://localhost:7280';

    const handleSuccess = () => {
        setSuccess(true);
        setMessage('Group created successfully.');
    };

    const handleError = (err) => {
        setSuccess(false);
    };

    const resetForm = () => {
        window.location.reload();
    };

    // Get top group id
    useEffect(() => {
        axios.get('/api/group/getTopGroup')
            .then(response => {
                // Set both, for the dropdown and default
                setAdminId(response.data);
                setParentGroupId(response.data);
            })
            .catch(error => {
                console.error('Could not fetch top group:', error);
            });
    }, []);

    // Get groups for parent dropdown
    useEffect(() => {
        const token = localStorage.getItem('token');
        const decoded = jwt_decode(token);
        const username = decoded.sub;

        axios.get(`/api/group/getUserGroups?username=${username}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                setUserGroups(response.data);
            })
            .catch(error => {
                console.error('Could not fetch user groups:', error);
            });
    }, []);

    // Get usernames for combobox
    useEffect(() => {
        axios.get('/api/shared/getAllUsernames')
            .then(response => {
                setUsernames(response.data);
            })
            .catch(error => {
                console.error('Could not fetch usernames:', error);
            });
    }, []);
    const options = usernames.map(username => ({ value: username, label: username }));

    // Get auth token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            const decoded = jwt_decode(token);
            const usernameFromToken = decoded.sub;
            setUserName(usernameFromToken);
            setEnv('Production');
        }
    }, [navigate]);

    // Form submit command
    const handleCreateGroup = () => {
        if (groupname && username && parentGroupId) {
            axios.post('/api/group/createGroup', {
                groupname,
                username,
                parentGroupId
            })
                .then(response => {
                    handleSuccess();
                })
                .catch(error => {
                    handleError(error);
                });
        } else {
            setMessage('All required fields must be filled.');
            console.log(groupname, username, parentGroupId, adminId);
        }
    };

    return (
        <div className="sub-container outer">
            <div className="form-header">
                <h2>Create a New Group</h2>
            </div>
            <section className="box form-box">
                <div className="form-element">
                    <label>Group Name</label><br/>
                    <input type="text" value={groupname} onChange={e => setGroupName(e.target.value)} className="input-style-default" />
                </div>
                <div className="form-element" hidden>
                    <label>Username</label><br />
                    <input type="text" value={username} readOnly className="input-style-default" />
                </div>
                <div className="form-element">
                    <label>Underneath Group:</label><br />
                    <select
                        value={parentGroupId}
                        onChange={e => setParentGroupId(e.target.value)}
                        className="input-style-default standard-select"
                        style={{ fontSize: "1em" }}>
                        {userGroups.map(group => (
                            <option key={group.id} value={group.id}>{group.groupName}</option>
                        ))}
                    </select>
                </div><br/>
                <section>
                    <label>Group Owners</label>
                    <DualListBox
                        options={options}
                        selected={selectedOwners}
                        canFilter
                        onChange={(selected) => setSelectedOwners(selected)}
                    />
                    <br/><br/>
                    <label>Group Members</label>
                    <DualListBox
                        options={options}
                        selected={selectedMembers}
                        onChange={(selected) => setSelectedMembers(selected)}
                        canFilter
                    />
                </section>
                <br/><br/>
                <button onClick={handleCreateGroup} className="btn-three">Create Group</button><br />
                <label className="result-label"></label>
                <p className="success-message">{message}</p>
            </section>
            {success && (
                <div>
                    <button onClick={() => navigate('/')} className="btn-four inline-pad">Go to Dashboard</button>
                    <button onClick={resetForm} className="btn-four">Reset Form</button><br />
                </div>
            )}
        </div>
    );
};

export default GroupForm;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import DualListBox from 'react-dual-listbox';
import 'react-dual-listbox/lib/react-dual-listbox.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { } from '@fortawesome/free-solid-svg-icons';

const CreateGroup = () => {
    const [groupname, setGroupName] = useState('');
    const [username, setUserName] = useState('');
    const [usernames, setUsernames] = useState([]);
    const [selectedOwners, setSelectedOwners] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [parentId, setParentId] = useState(null);
    const navigate = useNavigate();
    const [env, setEnv] = useState('');

    axios.defaults.baseURL = 'https://localhost:7280';

    // Get usernames for combobox
    useEffect(() => {
        axios.get('/api/Shared/getAllUsernames')
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
        if (groupname && username && parentId) {
            axios.post('/api/Group/createGroup', {
                groupname,
                username,
                parentId
            })
                .then(response => {
                    console.log(response.data);
                    navigate('/dashboard');
                })
                .catch(error => {
                    console.error('Could not create group:', error);
                });
        } else {
            console.error('All required fields must be filled.');
        }
    };

    return (
        <div className="sub-container centered-content outer">
            <div className="header">
                <h2>Create a New Group</h2>
            </div>
            <section className="box form-box">
                <div className="form-element">
                    <label>Group Name</label><br/>
                    <input type="text" value={groupname} onChange={e => setGroupName(e.target.value)} className="input-style" />
                </div>
                <div className="form-element" hidden>
                    <label>Username</label><br />
                    <input type="text" value={username} readOnly className="input-style" />
                </div>
                <div className="form-element">
                    <label>Underneath Group:</label><br />
                    <select value={parentId} onChange={e => setParentId(e.target.value)} className="input-style standard-select" style={{ fontSize: "1em" }}>
                        <option value="">None</option>
                        {/* You can map your parent group options here */}
                    </select>
                </div>
                <section className="form-box">
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
            </section>
        </div>
    );
};

export default CreateGroup;
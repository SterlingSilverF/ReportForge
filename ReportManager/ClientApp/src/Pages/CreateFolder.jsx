import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const CreateFolder = () => {
    const [folderName, setFolderName] = useState('');
    const [username, setUsername] = useState(null);
    const [parentId, setParentId] = useState('');
    const [groupId, setGroupId] = useState(null);
    const [folders, setFolders] = useState([]);
    const [userGroups, setUserGroups] = useState([]);
    const [folderType, setFolderType] = useState('group');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    axios.defaults.baseURL = 'https://localhost:7280';

    const handleSuccess = () => {
        setSuccess(true);
        setMessage('Folder created successfully.');
    };

    const handleError = (err) => {
        setSuccess(false);
    };

    const resetForm = () => {
        window.location.reload();
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const decoded = jwt_decode(token);
        const username = decoded.sub;
        setUsername(username);

        // Fetch user groups and personal folders
        axios.get(`/api/group/getUserGroups?username=${username}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(groupsResponse => {
                const userGroups = groupsResponse.data.slice(1); // Exclude the first group

                axios.get(`/api/folder/getPersonalFolders?username=${username}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then(foldersResponse => {
                        const personalFolders = foldersResponse.data;

                        // Now you have both userGroups and personalFolders available
                        setUserGroups(userGroups);
                        setFolders(personalFolders);
                    })
                    .catch(error => {
                        console.error('Could not fetch user folders:', error);
                    });
            })
            .catch(error => {
                console.error('Could not fetch user groups:', error);
            });
    }, []);

    const fetchFoldersByGroup = () => {
        if (folderType === 'group' && groupId) {
            const apiURL = `/api/folder/getFoldersByGroupId?groupId=${groupId}`;
            axios.get(apiURL)
                .then(response => {
                    const fetchedFolders = response.data;
                    setFolders(fetchedFolders);
                })
                .catch(error => {
                    console.error(`Could not fetch folders by group: ${error}`);
                });
        }
    };

    useEffect(() => {
        fetchFoldersByGroup();
    }, [folderType, groupId]);

    const handleCreateFolder = () => {
        if (folderName && username && parentId) {
            const IsGroupFolder = folderType === 'group';

            axios.post('/api/folder/createFolder', {
                FolderName: folderName,
                Username: username,
                ParentId: parentId,
                GroupId: IsGroupFolder ? groupId : '',
                IsGroupFolder: IsGroupFolder
            })
                .then(response => {
                    handleSuccess();
                })
                .catch(error => {
                    handleError(error);
                    setMessage("Something went wrong.");
                });
        } else {
            setMessage('All required fields must be filled.');
        }
    };

    return (
        <div className="sub-container outer">
            <div className="form-header">
                <h2>Create a New Folder</h2>
            </div>
            <section className="box form-box">
                <div className="form-element">
                    <label>Folder Name:</label><br />
                    <input
                        type="text"
                        value={folderName}
                        onChange={e => setFolderName(e.target.value)}
                        className="input-style"
                    />
                </div>
                <div className="form-element">
                    <label>Type:</label><br />
                    <label className="radio-container">
                        <input
                            type="radio"
                            value="group"
                            checked={folderType === 'group'}
                            onChange={() => setFolderType('group')}
                        />
                        Group
                        <span className="radio-checkmark"></span>
                    </label>
                    <label className="radio-container">
                        <input
                            type="radio"
                            value="personal"
                            checked={folderType === 'personal'}
                            onChange={() => setFolderType('personal')}
                        />
                        Personal
                        <span className="radio-checkmark"></span>
                    </label>
                </div>

                {folderType === 'group' && (
                    <div className="form-element">
                        <label>Group:</label><br />
                        <select
                            value={groupId}
                            onChange={e => setGroupId(e.target.value)}
                            className="input-style standard-select"
                            style={{ fontSize: "1em" }}>
                            <option value={null}>--Select a group--</option>
                            {userGroups.map(group => (
                                <option key={group.id} value={group.id}>{group.groupName}</option>
                            ))}
                        </select>
                    </div>
                )}
                {folderType === 'group' && groupId && (
                    <div className="form-element">
                        <label>Parent Folder:</label><br />
                        <select
                            value={parentId}
                            onChange={e => setParentId(e.target.value)}
                            className="input-style standard-select"
                            style={{ fontSize: "1em" }}>
                            <option value={null}>--Select a group--</option>
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.folderName}</option>
                            ))}
                        </select>
                    </div>
                )}
                <br/>
                <button onClick={handleCreateFolder} className="btn-three">Create Folder</button><br />
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
}

export default CreateFolder;
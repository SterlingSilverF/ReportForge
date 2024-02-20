import React, { useState, useEffect } from 'react';
import HOC from '../components/HOC';

const FolderForm = ({ navigate, username, makeApiRequest }) => {
    const [folderName, setFolderName] = useState('');
    const [parentId, setParentId] = useState('');
    const [groupId, setGroupId] = useState(null);
    const [folders, setFolders] = useState([]);
    const [userGroups, setUserGroups] = useState([]);
    const [folderType, setFolderType] = useState('group');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSuccess = () => {
        setSuccess(true);
        setMessage('Folder created successfully.');
    };

    const handleError = (err) => {
        setSuccess(false);
        setMessage("Something went wrong.");
    };

    const resetForm = () => {
        window.location.reload();
    };

    const validateFolderForm = () => {
        let missingFields = [];

        if (!folderName.trim()) missingFields.push("Folder Name");
        if (folderType === 'group' && !groupId) missingFields.push("Group");
        if (folderType === 'group' && !parentId) missingFields.push("Parent Folder");

        return missingFields;
    };


    useEffect(() => {
        if (username) {
            makeApiRequest('get', `/api/group/getUserGroups?username=${username}`)
                .then(groupsResponse => {
                    const userGroups = groupsResponse.data.slice(1); // Exclude the first group
                    makeApiRequest('get', `/api/folder/getPersonalFolders?username=${username}`)
                        .then(foldersResponse => {
                            setUserGroups(userGroups);
                            setFolders(foldersResponse.data);
                        })
                        .catch(error => {
                            console.error('Could not fetch user folders:', error);
                        });
                })
                .catch(error => {
                    console.error('Could not fetch user groups:', error);
                });
        }
    }, [username, makeApiRequest]);

    useEffect(() => {
        if (folderType === 'group' && groupId) {
            makeApiRequest('get', `/api/folder/getFoldersByGroupId?groupId=${groupId}`)
                .then(response => {
                    setFolders(response.data);
                })
                .catch(error => {
                    console.error(`Could not fetch folders by group: ${error}`);
                });
        }
    }, [folderType, groupId, makeApiRequest]);

    const handleCreateFolder = () => {
        const missingFields = validateFolderForm();

        // If there are missing fields, construct and display an error message
        if (missingFields.length > 0) {
            const fieldsList = missingFields.join(", ");
            setMessage(`Please fill out the following required fields: ${fieldsList}.`);
            setSuccess(false);
            return;
        }

        const data = {
            FolderName: folderName,
            Username: username,
            GroupId: folderType === 'group' ? groupId : '',
            ParentId: folderType === 'group' ? parentId : '',
            IsGroupFolder: folderType === 'group'
        };

        makeApiRequest('post', '/api/folder/createFolder', data)
            .then(() => {
                handleSuccess();
            })
            .catch((error) => {
                handleError(error);
            });
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
                        className="input-style-default"
                    />
                </div>
                <div className="form-element">
                    <label>Type:</label>
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
                            className="input-style-default standard-select"
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
                            className="input-style-default standard-select"
                            style={{ fontSize: "1em" }}>
                            <option value={null}>--Select a group--</option>
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.folderName}</option>
                            ))}
                        </select>
                    </div>
                )}
                <br />
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

export default HOC(FolderForm);
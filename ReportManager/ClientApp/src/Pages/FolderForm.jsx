import React, { useState, useEffect } from 'react';
import HOC from '../components/HOC';
import { useLocation } from 'react-router-dom';

const FolderForm = ({ navigate, username, makeApiRequest }) => {
    const [folderName, setFolderName] = useState('');
    const [parentId, setParentId] = useState('');
    const [groupId, setGroupId] = useState(null);
    const [folders, setFolders] = useState([]);
    const [userGroups, setUserGroups] = useState([]);
    const [folderType, setFolderType] = useState('group');
    const [folderData, setFolderData] = useState([]);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const folderId = queryParams.get('folderId');
    const isPersonal = queryParams.get('isPersonal');
    const [isEditMode, setIsEditMode] = useState(false);

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
        if (folderId && isPersonal) {
            makeApiRequest('get', `/api/folder/GetFolderById?folderId=${folderId}&isPersonal=${isPersonal}`)
                .then(response => {
                    const folder = response.data;
                    setFolderData(folder);
                    setFolderName(folder.folderName);
                    setParentId(folder.parentId);
                    setGroupId(folder.groupId);
                    setFolderType(folder.isGroupFolder ? 'group' : 'personal');
                    setIsEditMode(true);
                })
                .catch(error => {
                    console.error('Could not fetch folder by ID:', error);
                });
        } else {
            setIsEditMode(false);
        }
    }, [folderId, makeApiRequest, isPersonal]);

    useEffect(() => {
        if (username) {
            makeApiRequest('get', `/api/group/getUserGroups?username=${username}`)
                .then(groupsResponse => {
                    const userGroups = groupsResponse.data.slice(1);
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

        if (missingFields.length > 0) {
            const fieldsList = missingFields.join(", ");
            setMessage(`Please fill out the following required fields: ${fieldsList}.`);
            return;
        }

        const data = {
            FolderName: folderName,
            Username: username,
            GroupId: folderType === 'group' ? groupId : '',
            ParentId: folderType === 'group' ? parentId : '',
            IsGroupFolder: folderType === 'group'
        };

        const apiEndpoint = isEditMode ? `/api/folder/updateFolder` : `/api/folder/createFolder`;
        const httpMethod = isEditMode ? 'put' : 'post';

        if (isEditMode) {
            data.id = folderId;
        }

        makeApiRequest(httpMethod, apiEndpoint, data)
            .then(() => {
                const successMessage = isEditMode ? 'Folder updated successfully.' : 'Folder created successfully.';
                setMessage(successMessage);
                setSuccess(true);
            })
            .catch(() => {
                setMessage("Something went wrong.");
                setSuccess(false);
            });
    };

    const handleUpdateFolder = () => {
        const missingFields = validateFolderForm();

        if (missingFields.length > 0) {
            const fieldsList = missingFields.join(", ");
            setMessage(`Please fill out the following required fields: ${fieldsList}.`);
            return;
        }

        makeApiRequest('put', '/api/folder/updateFolder', folderData)
            .then(response => {
                setMessage("Folder updated successfully.");
                setSuccess(true);
            })
            .catch(error => {
                console.log(error);
                setMessage("Folder failed to update.");
                setSuccess(false);
            });
    };

    const handleDeleteFolder = () => {
        if (window.confirm('Warning: Deleting this folder will also delete all its subfolders and files. Are you sure you want to proceed?')) {
            makeApiRequest('delete', `/api/folder/deleteFolder?folderId=${folderId}&isPersonal=${isPersonal}`)
                .then(() => {
                    alert('Folder deleted successfully.');
                    setTimeout(() => {
                        navigate('/');
                    }, 2000);
                })
                .catch(error => {
                    alert('Error deleting folder. Please try again later.');
                    console.error('Error deleting folder:', error);
                });
        }
    };

    return (
        <div className="sub-container outer">
            <div className="form-header">
                <h2>{isEditMode ? 'Edit Folder' : 'Create Folder'}</h2>
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
                            <option value="">--Select a group--</option>
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
                            <option value="">--Select a group--</option>
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.folderName}</option>
                            ))}
                        </select>
                    </div>
                )}
                <br />
                <button onClick={isEditMode ? handleUpdateFolder : handleCreateFolder} className="btn-three">
                    {isEditMode ? 'Update Folder' : 'Create Folder'}
                </button>
                <br />
                {isEditMode && (
                    <button onClick={handleDeleteFolder} className="btn-five">Delete Folder</button>
                )}
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
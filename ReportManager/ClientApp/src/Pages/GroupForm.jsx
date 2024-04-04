import React, { useEffect, useState } from 'react';
import DualListBox from 'react-dual-listbox';
import 'react-dual-listbox/lib/react-dual-listbox.css';
import HOC from '../components/HOC';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons';

const GroupForm = ({ makeApiRequest, username, navigate }) => {
    // TODO: create context for group form
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const groupId = queryParams.get('groupId');
    const [groupConnectionStrings, setGroupConnectionStrings] = useState([]);
    const [groupFolders, setGroupFolders] = useState([]);
    const [formTitle, setFormTitle] = useState('Create New Group');
    const [buttonText, setButtonText] = useState('Create Group');
    const [successText, setSuccessText] = useState('Group created successfully.');
    const [isEditMode, setIsEditMode] = useState(false);

    const [groupname, setGroupName] = useState('');
    const [userGroups, setUserGroups] = useState([]);
    const [selectedOwners, setSelectedOwners] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('');
    const [usernames, setUsernames] = useState([]);
    const options = usernames.map(u => ({ value: u, label: u }));

    // IsEditMode
    useEffect(() => {
        if (groupId) {
            makeApiRequest('get', `/api/group/GetGroupById?groupId=${groupId}`)
                .then(response => {
                    const group = response.data;
                    setGroupName(group.groupName);
                    setSelectedOwners(group.groupOwners);
                    setSelectedMembers(group.groupMembers);
                    setGroupConnectionStrings(group.groupConnectionStrings);
                    setGroupFolders(group.folders);
                    setIsEditMode(true);
                    setFormTitle('Edit Group');
                    setButtonText('Save Changes');
                    setSuccessText('Group updated successfully.')
                })
                .catch(error => {
                    console.error('Could not fetch group by ID:', error);
                });
        }
    }, [groupId, makeApiRequest]);

    const handleSuccess = () => {
        setSuccess(true);
        setMessage(successText);
    };

    const handleError = () => {
        setSuccess(false);
    };

    const resetForm = () => {
        setGroupName('');
        setMessage('');
        setSuccess(false);
    };

    useEffect(() => {
        if (username && selectedOwners.length === 0 && selectedMembers.length === 0) {
            setSelectedOwners([username]);
            setSelectedMembers([username]);
        }
    }, [username]);

    useEffect(() => {
        if (username) {
            makeApiRequest('get', `/api/group/getUserGroups?username=${username}`)
                .then(response => {
                    setUserGroups(response.data);
                })
                .catch(error => {
                    console.error('Could not fetch user groups:', error);
                });

            makeApiRequest('get', '/api/shared/getAllUsernames')
                .then(response => {
                    const filteredUsernames = response.data.filter(u => u !== username);
                    setUsernames(filteredUsernames);
                })
                .catch(error => {
                    console.error('Could not fetch usernames:', error);
                });
        }
    }, [makeApiRequest, username]);

    const handleCreateGroup = () => {
        if (groupname && username) {
            let payload = {};

            if (isEditMode) {
                payload = {
                    id: groupId,
                    groupName: groupname,
                    groupOwners: selectedOwners,
                    groupMembers: selectedMembers,
                    groupConnectionStrings: groupConnectionStrings,
                    folders: groupFolders
                };

                makeApiRequest('put', `/api/group/updateGroup`, payload)
                    .then(handleSuccess)
                    .catch(handleError);
            } else {
                payload = {
                    groupname: groupname,
                    username: username,
                    ...(selectedOwners && selectedOwners.length > 0 && { groupOwners: selectedOwners }),
                    ...(selectedMembers && selectedMembers.length > 0 && { groupMembers: selectedMembers })
                };

                makeApiRequest('post', '/api/group/createGroup', payload)
                    .then(handleSuccess)
                    .catch(handleError);
            }
        } else {
            setMessage('All required fields must be filled.');
        }
    };

    const handleDeleteGroup = () => {
        if (window.confirm('Are you sure you want to delete this group? All items stored under it will be deleted!')) {
            makeApiRequest('delete', `/api/group/deleteGroup?groupId=${groupId}`)
                .then(() => {
                    setAlertMessage('Group deleted successfully.');
                    setAlertType('success');
                    setTimeout(() => {
                       navigate('/');
                    }, 3000);
                })
                .catch((error) => {
                    setAlertMessage('Error deleting group. Please contact your system administrator.');
                    setAlertType('error');
                    console.error('Error deleting group:', error);
                });
        }
    };

    const fontAwesomeIcons = {
        moveLeft: <FontAwesomeIcon icon={faAngleLeft} />,
        moveAllLeft: [
            <FontAwesomeIcon key={0} icon={faAngleLeft} />,
            <FontAwesomeIcon key={1} icon={faAngleLeft} />,
        ],
        moveRight: <FontAwesomeIcon icon={faAngleRight} />,
        moveAllRight: [
            <FontAwesomeIcon key={0} icon={faAngleRight} />,
            <FontAwesomeIcon key={1} icon={faAngleRight} />,
        ],
        moveUp: <FontAwesomeIcon icon={faAngleLeft} />,
        moveDown: <FontAwesomeIcon icon={faAngleRight} />,
    };

    return (
        <div className="sub-container outer">
            <div className="form-header">
                <h2>{formTitle}</h2>
            </div>
            <section className="box form-box">
                <div className="form-element">
                    <label>Group Name</label><br/>
                    <input type="text" value={groupname} onChange={e => setGroupName(e.target.value)} className="input-style-default" />
                </div>
                <div className="form-element" hidden>
                    <label>Username</label><br />
                    <input type="text" value={username} readOnly className="input-style-default" />
                </div><br/>
                <section>
                    <label>Group Owners</label>
                    <DualListBox
                        icons={fontAwesomeIcons}
                        options={options}
                        selected={selectedOwners}
                        canFilter
                        onChange={(selected) => setSelectedOwners(selected)}
                    />
                    <br/><br/>
                    <label>Group Members</label>
                    <DualListBox
                        icons={fontAwesomeIcons}
                        options={options}
                        selected={selectedMembers}
                        onChange={(selected) => setSelectedMembers(selected)}
                        canFilter
                    />
                </section>
                <br/>
                <button onClick={handleCreateGroup} className="btn-three">{buttonText}</button>
                <br/>
                {isEditMode && (
                    <button onClick={handleDeleteGroup} className="btn-five">Delete Group</button>
                )}
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

export default HOC(GroupForm);
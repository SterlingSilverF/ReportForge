import React, { useEffect, useState } from 'react';
import DualListBox from 'react-dual-listbox';
import 'react-dual-listbox/lib/react-dual-listbox.css';
import HOC from '../components/HOC';
import TooltipIcon from '../components/tooltip';
import { useLocation } from 'react-router-dom';

const GroupForm = ({ makeApiRequest, username, navigate }) => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const groupId = queryParams.get('groupId');
    const [groupConnectionStrings, setGroupConnectionStrings] = useState([]);
    const [groupFolders, setGroupFolders] = useState([]);
    const [isTopGroup, setIsTopGroup] = useState(false);
    const [formTitle, setFormTitle] = useState('Create New Group');
    const [buttonText, setButtonText] = useState('Create Group');
    const [successText, setSuccessText] = useState('Group created successfully.');
    const [isEditMode, setIsEditMode] = useState(false);

    const [groupname, setGroupName] = useState('');
    const [userGroups, setUserGroups] = useState([]);
    const [selectedOwners, setSelectedOwners] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [parentGroupId, setParentGroupId] = useState(null);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [usernames, setUsernames] = useState([]);
    const options = usernames.map(u => ({ value: u, label: u }));

    // IsEditMode
    useEffect(() => {
        if (groupId) {
            makeApiRequest('get', `/api/group/GetGroupById?groupId=${groupId}`)
                .then(response => {
                    const group = response.data;
                    setGroupName(group.groupName);
                    setParentGroupId(group.parentId);
                    setSelectedOwners(group.groupOwners);
                    setSelectedMembers(group.groupMembers);
                    setGroupConnectionStrings(group.groupConnectionStrings);
                    setGroupFolders(group.folders);
                    setIsTopGroup(group.isTopGroup);
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


    // TODO: handlesuccess groupform
    const handleSuccess = () => {
        setSuccess(true);
        setMessage(successText);
    };

    const handleError = () => {
        setSuccess(false);
    };

    const resetForm = () => {
        setGroupName('');
        setParentGroupId(userGroups[0]?.id || null);
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
            makeApiRequest('get', '/api/group/getTopGroup')
                .then(response => {
                    setParentGroupId(response.data);
                })
                .catch(error => {
                    console.error('Could not fetch top group:', error);
                });

            makeApiRequest('get', `/api/group/getUserGroups?username=${username}`)
                .then(response => {
                    setUserGroups(response.data);
                    if (!parentGroupId) {
                        setParentGroupId(response.data[0]?.id);
                    }
                })
                .catch(error => {
                    console.error('Could not fetch user groups:', error);
                });

            makeApiRequest('get', '/api/shared/getAllUsernames')
                .then(response => {
                    // Exclude the user's own username from the options
                    const filteredUsernames = response.data.filter(u => u !== username);
                    setUsernames(filteredUsernames);
                })
                .catch(error => {
                    console.error('Could not fetch usernames:', error);
                });
        }
    }, [makeApiRequest, username]);

    const handleCreateGroup = () => {
        if (groupname && username && parentGroupId) {
            let payload = {};

            if (isEditMode) {
                payload = {
                    id: groupId,
                    groupName: groupname,
                    groupOwners: selectedOwners,
                    groupMembers: selectedMembers,
                    groupConnectionStrings: groupConnectionStrings,
                    folders: groupFolders,
                    parentId: parentGroupId,
                    isTopGroup: isTopGroup
                };

                makeApiRequest('put', `/api/group/updateGroup`, payload)
                    .then(handleSuccess)
                    .catch(handleError);
            } else {
                payload = {
                    groupname: groupname,
                    username: username,
                    parentId: parentGroupId,
                    ...(selectedOwners && selectedOwners.length > 0 && { groupOwners: selectedOwners }),
                    ...(selectedMembers && selectedMembers.length > 0 && { groupMembers: selectedMembers }),
                };

                makeApiRequest('post', '/api/group/createGroup', payload)
                    .then(handleSuccess)
                    .catch(handleError);
            }
        } else {
            setMessage('All required fields must be filled.');
        }
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
                </div>
                <div className="form-element">
                    <label>Underneath Group:</label><TooltipIcon formName="groupform" fieldName="parent group" />
                    <br/>
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
                <button onClick={handleCreateGroup} className="btn-three">{buttonText}</button><br />
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
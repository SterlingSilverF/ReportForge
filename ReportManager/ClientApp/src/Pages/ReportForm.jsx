import React, { useState, useEffect } from 'react';
import HOC from '../components/HOC';

const ReportForm = ({ makeApiRequest, username, userID, navigate }) => {
    // State variables
    const [reportName, setReportName] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [reportType, setReportType] = useState('personal');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groups, setGroups] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [message, setMessage] = useState('');

    // Load user groups when report type is 'group'
    useEffect(() => {
        if (reportType === 'group') {
            const fetchUserGroups = async () => {
                try {
                    const response = await makeApiRequest('get', `/api/group/getUserGroups?username=${username}`);
                    setGroups(response.data);
                } catch (error) {
                    console.error('Could not fetch user groups:', error);
                }
            };
            fetchUserGroups();
        }
    }, [reportType, makeApiRequest, username]);

    // Fetch folders based on report type and selected group
    useEffect(() => {
        if (username) {
            let folderApiEndpoint = reportType === 'group' && selectedGroup
                ? `/api/folder/getFoldersByGroupId?groupId=${selectedGroup}`
                : `/api/folder/getPersonalFolders?username=${username}`;

            const fetchFolders = async () => {
                try {
                    const response = await makeApiRequest('get', folderApiEndpoint);
                    setFolders(response.data);
                } catch (error) {
                    console.error('Could not fetch folders:', error);
                }
            };
            fetchFolders();
        }
    }, [reportType, selectedGroup, makeApiRequest, username]);

    const fetchConnections = async (ownerIdParam = null, ownerTypeParam = null) => {
        const ownerId = ownerIdParam || (reportType === 'group' ? selectedGroup : userID);
        const ownerType = ownerTypeParam || (reportType === 'group' ? 'Group' : 'User');
        const apiEndpoint = `/api/connection/GetAllConnections?ownerId=${ownerId}&ownerTypeString=${ownerType}&connectionType=both`;

        try {
            const response = await makeApiRequest('get', apiEndpoint);
            setConnections(response.data);
        } catch (error) {
            console.error('Could not fetch connections:', error);
            setConnections([]);
        }
    };

    const handleReportTypeChange = async (e) => {
        const newReportType = e.target.value;
        setReportType(newReportType);
        setSelectedGroup(null);
        setSelectedConnection(null);
        setSelectedFolder(null);

        if (newReportType === 'group') {
            setConnections([]);
        } else {
            await fetchConnections(); 
        }
    };

    const handleConnectionSelection = (e) => {
        setSelectedConnection(e.target.value);
    };

    const handleSubmit = () => {
        // TODO: report form step 1
        navigate('/reportdesigner');
    };

    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h2>Create a New Report</h2>
                <hr />
            </div>
            <section className="report-form-box">
                <h3>Basic Report Information</h3>
            <br/>
                {/* Name of Report */}
                <div className="form-element">
                    <label>Name of Report:</label><br />
                    <input
                        type="text"
                        value={reportName}
                        onChange={e => setReportName(e.target.value)}
                        className="input-style-medium"
                    />
                </div>

                {/* Report Description */}
                <div className="form-element">
                    <label>Description:</label><br />
                    <textarea
                        value={reportDescription}
                        onChange={e => setReportDescription(e.target.value)}
                        className="input-style-long"
                    />
                </div>
                <br />
                <h3>Report Setup</h3>
                <br/>
                <div className='form-element' style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                        {/* Report Type */}
                        <div style={{ width: '300px' }}> {/* Static width set here */}
                            <label>Report Type:</label>
                            <select
                                value={reportType}
                                onChange={handleReportTypeChange}
                                className="input-style-default standard-select">
                                <option value="personal">Personal</option>
                                <option value="group">Group</option>
                            </select>
                        </div>

                        {/* Group Selection */}
                        {reportType === 'group' && (
                            <div style={{ flex: 1 }}>
                                <label>Group:</label>
                                <select
                                    value={selectedGroup}
                                    onChange={async (e) => {
                                        const newSelectedGroup = e.target.value;
                                        setSelectedGroup(newSelectedGroup);
                                        if (reportType === 'group' && newSelectedGroup) {
                                            await fetchConnections(newSelectedGroup, 'Group');
                                        } else {
                                            if (reportType === 'personal') {
                                                await fetchConnections(userID, 'User');
                                            } else {
                                                setConnections([]);
                                            }
                                        }
                                    }}
                                    className="input-style-default standard-select">
                                    <option value="">--Select a group--</option>
                                    {groups.map(group => (
                                        <option key={group.id} value={group.id}>{group.groupName}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                    </div>
                </div>

                <small>The below are updated based on report type selection</small>
                <br/>
                {/* Connection Selection */}
                <div className="form-element">
                    <label>Connection:</label><br/>
                    <select
                        value={selectedConnection}
                        onChange={handleConnectionSelection}
                        className="input-style-medium">
                        <option value={null}>--Select a connection--</option>
                        {connections.map(connection => (
                            <option key={connection.id} value={connection.id}>{`(${connection.dbType}): ${connection.serverName}`}</option>
                        ))}
                    </select>
                </div>

                {/* Folder Selection */}
                <div className="form-element">
                    <label>Store Report In:</label><br />
                    <select
                        value={selectedFolder}
                        onChange={e => setSelectedFolder(e.target.value)}
                        className="input-style-default">
                        <option value={null}>--Select a folder--</option>
                        {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>{folder.folderName}</option>
                        ))}
                    </select>
                </div>
                <br/>
                <button onClick={handleSubmit} className="btn-three btn-restrict">Proceed to Designer</button><br />
            </section>
        </div>
    );
}

export default HOC(ReportForm);
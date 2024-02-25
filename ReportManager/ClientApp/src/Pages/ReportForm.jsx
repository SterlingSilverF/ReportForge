import React, { useState, useEffect } from 'react';
import HOC from '../components/HOC';
import MessageDisplay from '../components/MessageDisplay';
import { useReportForm } from '../contexts/ReportFormContext';

const ReportForm = ({ makeApiRequest, username, userID, navigate }) => {
    // State variables
    const { reportFormData, updateReportFormData } = useReportForm();
    const [groups, setGroups] = useState([]);
    const [connections, setConnections] = useState([]);
    const [folders, setFolders] = useState([]);
    const [message, setMessage] = useState('');
    const [messageSuccess, setMessageSuccess] = useState(true);

    const fetchConnections = async (ownerIdParam, ownerTypeParam) => {
        const ownerId = ownerIdParam || (reportFormData.reportType === 'Group' ? reportFormData.selectedGroup : userID);
        const ownerType = ownerTypeParam || (reportFormData.reportType === 'Group' ? 'Group' : 'User');
        const apiEndpoint = `/api/connection/GetAllConnections?ownerId=${ownerId}&ownerTypeString=${ownerType}&connectionType=database`;

        try {
            const response = await makeApiRequest('get', apiEndpoint);
            setConnections(response.data);
        } catch (error) {
            console.error('Could not fetch connections:', error);
            setConnections([]);
        }
    };

    useEffect(() => {
        if (reportFormData.reportType === 'Group') {
            const fetchUserGroups = async () => {
                try {
                    const response = await makeApiRequest('get', `/api/group/getUserGroups?username=${username}`);
                    const filteredGroups = response.data.filter(group => !group.isTopGroup);
                    setGroups(filteredGroups);
                } catch (error) {
                    console.error('Could not fetch user groups:', error);
                }
            };
            fetchUserGroups();
        }
    }, [reportFormData.reportType, makeApiRequest, username]);

    // Fetch personal connections on load for 'personal' report type
    useEffect(() => {
        if (reportFormData.reportType === 'Personal' && userID) {
            fetchConnections(userID, 'User');
        }
    }, [reportFormData.reportType, userID]);


    // Fetch folders based on report type and selected group
    useEffect(() => {
        const fetchFolders = async () => {
            let folderApiEndpoint = reportFormData.reportType === 'Group' && reportFormData.selectedGroup
                ? `/api/folder/getFoldersByGroupId?groupId=${reportFormData.selectedGroup}`
                : `/api/folder/getPersonalFolders?username=${username}`;

            try {
                const response = await makeApiRequest('get', folderApiEndpoint);
                setFolders(response.data);
            } catch (error) {
                console.error('Could not fetch folders:', error);
                setFolders([]);
            }
        };

        if ((reportFormData.reportType === 'Personal' && username) || (reportFormData.reportType === 'Group' && reportFormData.selectedGroup)) {
            fetchFolders();
        } else {
            setFolders([]);
        }
    }, [reportFormData.reportType, reportFormData.selectedGroup, makeApiRequest, username]);

    const handleReportTypeChange = async (e) => {
        const newReportType = e.target.value;
        updateReportFormData({ reportType: e.target.value });
        updateReportFormData({
            selectedGroup: null,
            selectedConnection: null,
            selectedFolder: null,
        });
        if (newReportType === 'Personal') {
            await fetchConnections(userID, 'User');
        }
    };

    const handleChange = (fieldName, value) => {
        updateReportFormData({ [fieldName]: value });
    };

    const validateForm = () => {
        let missingFields = [];

        if (!reportFormData.reportName.trim()) missingFields.push("Report Name");
        if (!reportFormData.selectedConnection) missingFields.push("Connection");
        if (!reportFormData.selectedFolder) missingFields.push("Folder");
        if (reportFormData.reportType === 'Group' && !reportFormData.selectedGroup) missingFields.push("Group");

        if (missingFields.length > 0) {
            const fieldsList = missingFields.join(", ");
            setMessage(`Missing required fields: ${fieldsList}.`);
            setMessageSuccess(false);
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const selectedConnection = connections.find(connection => connection.id === reportFormData.selectedConnection);
        if (!selectedConnection) {
            console.error("Selected connection not found.");
            return;
        }
        const _dbType = selectedConnection.dbType;
        updateReportFormData({ dbType: _dbType });
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
                        value={reportFormData.reportName}
                        onChange={(e) => handleChange('reportName', e.target.value)}
                        className="input-style-medium"
                    />
                </div>

                {/* Report Description */}
                <div className="form-element">
                    <label>Description (Optional):</label><br />
                    <textarea
                        value={reportFormData.reportDescription}
                        onChange={(e) => handleChange('reportDescription', e.target.value)}
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
                                value={reportFormData.reportType}
                                onChange={handleReportTypeChange}
                                className="input-style-default standard-select">
                                <option value="Personal">Personal</option>
                                <option value="Group">Group</option>
                            </select>
                        </div>

                        {/* Group Selection */}
                        {reportFormData.reportType === 'Group' && (
                            <div style={{ flex: 1 }}>
                                <label>Group:</label>
                                <select
                                    value={reportFormData.selectedGroup || ''}
                                    onChange={async (e) => {
                                        const newSelectedGroup = e.target.value;
                                        handleChange('selectedGroup', newSelectedGroup);
                                        if (newSelectedGroup) {
                                            await fetchConnections(newSelectedGroup, 'Group');
                                        } else {
                                            handleChange('connections', []);
                                            handleChange('folders', []);
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
                    <label>Connection:</label><br />
                    <select
                        value={reportFormData.selectedConnection || ''}
                        onChange={(e) => handleChange('selectedConnection', e.target.value)}
                        className="input-style-medium">
                        <option value="">--Select a connection--</option>
                        {connections.map(connection => (
                            <option key={connection.id} value={connection.id}>{`(${connection.dbType}): ${connection.serverName}`}</option>
                        ))}
                    </select>
                </div>

                {/* Folder Selection */}
                <div className="form-element">
                    <label>Store Report In:</label><br />
                    <select
                        value={reportFormData.selectedFolder || ''}
                        onChange={(e) => handleChange('selectedFolder', e.target.value)}
                        className="input-style-default">
                        <option value="">--Select a folder--</option>
                        {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>{folder.folderName}</option>
                        ))}
                    </select>
                </div>
                {message && <MessageDisplay message={message} isSuccess={messageSuccess} />}
                <br/>
                <button onClick={handleSubmit} className="btn-three btn-restrict">Proceed to Designer</button>
                <br />
            </section>
        </div>
    );
}

export default HOC(ReportForm);
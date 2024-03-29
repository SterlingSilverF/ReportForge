import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HOC from '../components/HOC';
import MessageDisplay from '../components/MessageDisplay';
import { useReportForm } from '../contexts/ReportFormContext';

const ReportForm = ({ makeApiRequest, username, userID, navigate }) => {
    const { reportFormContext, updateReportFormData } = useReportForm();
    const [groups, setGroups] = useState([]);
    const [connections, setConnections] = useState([]);
    const [folders, setFolders] = useState([]);
    const [message, setMessage] = useState('');
    const [messageSuccess, setMessageSuccess] = useState(true);
    const [hasFetchedGroups, setHasFetchedGroups] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const reportId = queryParams.get('reportId');
    const type = queryParams.get('type');

    // isEditMode
    useEffect(() => {
        const fetchReportData = async () => {
            if (reportId && type) {
                try {
                    const response = await makeApiRequest(
                        'get',
                        `/api/report/GetReportById?reportId=${reportId}&type=${type}&fullDataset=true`
                    );
                    const reportData = response.data;
                    updateReportFormData(reportData);
                    setIsEditMode(true);
                } catch (error) {
                    console.error('Could not fetch report data:', error);
                }
            }
        };

        fetchReportData();
    }, [reportId, type]);

    const fetchConnections = async (ownerIdParam, ownerTypeParam) => {
        const ownerId = ownerIdParam || (reportFormContext.reportType === 'Group' ? reportFormContext.selectedGroup : userID);
        const ownerType = ownerTypeParam || (reportFormContext.reportType === 'Group' ? 'Group' : 'User');
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
        if (reportFormContext.reportType === 'Group' && !hasFetchedGroups && username) {
            const fetchUserGroups = async () => {
                try {
                    const response = await makeApiRequest('get', `/api/group/getUserGroups?username=${username}`);
                    const filteredGroups = response.data.filter(group => !group.isTopGroup);
                    setGroups(filteredGroups);
                } catch (error) {
                    console.error('Could not fetch user groups:', error);
                }
            };
            fetchUserGroups().then(() => setHasFetchedGroups(true));;
        }
    }, [reportFormContext.reportType, makeApiRequest, username]);

    // Fetch User connections on load for 'User' report type
    useEffect(() => {
        if (reportFormContext.reportType === 'User' && userID) {
            fetchConnections(userID, 'User');
        }
        else if (reportFormContext.reportType === 'Group' && reportFormContext.selectedGroup) {
            fetchConnections(reportFormContext.selectedGroup, 'Group');
        }
    }, [reportFormContext.reportType, reportFormContext.selectedGroup, userID]);

    // Fetch folders based on report type and selected group
    useEffect(() => {
        const fetchFolders = async () => {
            let folderApiEndpoint = reportFormContext.reportType === 'Group' && reportFormContext.selectedGroup
                ? `/api/folder/getFoldersByGroupId?groupId=${reportFormContext.selectedGroup}`
                : `/api/folder/getPersonalFolders?username=${username}`;

            try {
                const response = await makeApiRequest('get', folderApiEndpoint);
                setFolders(response.data);
            } catch (error) {
                console.error('Could not fetch folders:', error);
                setFolders([]);
            }
        };

        if ((reportFormContext.reportType === 'User' && username) || (reportFormContext.reportType === 'Group' && reportFormContext.selectedGroup)) {
            fetchFolders();
        } else {
            setFolders([]);
        }
    }, [reportFormContext.reportType, reportFormContext.selectedGroup, makeApiRequest, username]);

    const handleReportTypeChange = async (e) => {
        const newReportType = e.target.value;
        updateReportFormData({ reportType: e.target.value });
        updateReportFormData({
            selectedGroup: null,
            selectedConnection: null,
            selectedFolder: null,
        });
        if (newReportType === 'User') {
            await fetchConnections(userID, 'User');
        }
    };

    const handleChange = (fieldName, value) => {
        updateReportFormData({ [fieldName]: value });
    };

    const validateForm = () => {
        let missingFields = [];

        if (!reportFormContext.reportName.trim()) missingFields.push("Report Name");
        if (!reportFormContext.selectedConnection) missingFields.push("Connection");
        if (!reportFormContext.selectedFolder) missingFields.push("Folder");
        if (reportFormContext.reportType === 'Group' && !reportFormContext.selectedGroup) missingFields.push("Group");

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

        const selectedConnection = connections.find(connection => connection.id === reportFormContext.selectedConnection);
        if (!selectedConnection) {
            console.error("Selected connection not found.");
            return;
        }
        const _dbType = selectedConnection.dbType;
        updateReportFormData({ dbType: _dbType });
        navigate(`/reportdesigner?isEditMode=${isEditMode}`);
    };

    const handleSaveUpdates = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            await makeApiRequest('put', `/api/report/UpdateReport`, reportFormContext);
            setMessage('Report updated successfully.');
            setMessageSuccess(true);
        } catch (error) {
            console.error('Error updating report:', error);
            setMessage('An error occurred while updating the report.');
            setMessageSuccess(false);
        }
    };

    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h2>{isEditMode ? 'Edit Report' : 'Create a New Report'}</h2>
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
                        value={reportFormContext.reportName}
                        onChange={(e) => handleChange('reportName', e.target.value)}
                        className="input-style-medium"
                    />
                </div>

                {/* Report Description */}
                <div className="form-element">
                    <label>Description (Optional):</label><br />
                    <textarea
                        value={reportFormContext.reportDescription}
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
                                value={reportFormContext.reportType}
                                onChange={handleReportTypeChange}
                                disabled={isEditMode}
                                className="input-style-default standard-select">
                                <option value="User">Personal</option>
                                <option value="Group">Group</option>
                            </select>
                        </div>

                        {/* Group Selection */}
                        {reportFormContext.reportType === 'Group' && (
                            <div style={{ flex: 1 }}>
                                <label>Group:</label>
                                <select
                                    disabled={isEditMode}
                                    value={reportFormContext.selectedGroup || ''}
                                    onChange={async (e) => {
                                        const newSelectedGroup = e.target.value;
                                        if (reportFormContext.selectedGroup !== newSelectedGroup) {
                                            handleChange('selectedGroup', newSelectedGroup);
                                            if (newSelectedGroup) {
                                                await fetchConnections(newSelectedGroup, 'Group');
                                                // TODO: Consider implementing similar logic for fetching folders here
                                            } else {
                                                handleChange('connections', []);
                                                handleChange('folders', []);
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
                    <label>Connection:</label><br />
                    <select
                        disabled={isEditMode}
                        value={reportFormContext.selectedConnection || ''}
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
                        value={reportFormContext.selectedFolder || ''}
                        onChange={(e) => handleChange('selectedFolder', e.target.value)}
                        className="input-style-default">
                        <option value="">--Select a folder--</option>
                        {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>{folder.folderName}</option>
                        ))}
                    </select>
                </div>
                {message && <MessageDisplay message={message} isSuccess={messageSuccess} />}
                <br />
                <div>
                    {isEditMode && (
                        <>
                            <button onClick={() => navigate(-1)} className="btn-three btn-restrict">
                                Cancel
                            </button>
                            <button onClick={handleSaveUpdates} className="btn-three btn-restrict">
                                Save Updates
                            </button>
                        </>
                    )}
                    <button onClick={handleSubmit} className="btn-three btn-restrict">Proceed to Designer</button>
                </div>
                <br />
            </section>
        </div>
    );
}

export default HOC(ReportForm);
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faArrowLeft, faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import HOC from '../components/HOC';


const GroupInformation = ({ makeApiRequest, goBack, navigate, username }) => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const groupId = queryParams.get('groupId');
    const [isAdmin, setIsAdmin] = useState(false);
    const [codeType, setCodeType] = useState('ReadOnly');
    const [expiresAfter, setExpiresAfter] = useState(1);
    const [expiresInUnit, setExpiresInUnit] = useState('minute');
    const [generatedCode, setGeneratedCode] = useState('');
    const [groupInfo, setGroupInfo] = useState({
        groupName: '',
        totalConnections: 0,
        totalMembers: 0,
        totalReports: 0,
        ownerNames: []
    });

    const handleEditClick = () => {
        navigate(`/groupform?groupId=${groupId}`);
    };

    const fetchReports = async () => {
        try {
            const response = await makeApiRequest('post', '/api/report/GetReportCount', {
                OwnerId: groupId,
                ReportType: 'Group'
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching report count:', error);
            return 0; // Return a default value in case of error
        }
    };

    const processGroupData = async () => {
        if (username) {
            try {
                const rawData = await makeApiRequest('get', `/api/group/GetGroupById?groupId=${groupId}`);
                const reports = await fetchReports();

                const transformedData = {
                    groupName: rawData.data.groupName,
                    totalConnections: rawData.data.groupConnectionStrings?.length ?? 0,
                    totalMembers: rawData.data.groupMembers?.length ?? 0,
                    totalReports: reports,
                    ownerNames: rawData.data.groupOwners
                };

                setGroupInfo(transformedData);
                const checkIsAdmin = rawData.data.groupOwners.includes(username);
                setIsAdmin(checkIsAdmin);
            } catch (error) {
                console.error('Could not fetch group info:', error);
            }
        }
    };

    useEffect(() => {
        if (groupId) {
            processGroupData();
        }
    }, [groupId, username]);

    const handleGenerateAccessCode = () => {
        // Assuming `makeApiRequest` is a function passed via props or context that abstracts the API call
        makeApiRequest('post', '/api/auth/generatePermissionKey', {
            username: username,
            groupname: groupInfo.groupName,
            userType: codeType,
            expirationDuration: expiresAfter,
            durationUnit: expiresInUnit
        })
            .then(response => {
                setGeneratedCode(response.data.key);
                document.querySelector('#generated_code').textContent = "Access Code: " + response.data.key;
                document.querySelector('#copied_message').textContent = "";
            })
            .catch(error => {
                console.error('Error generating access code:', error);
            });
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(generatedCode).then(() => {
            document.querySelector('#copied_message').textContent = "Copied!";
        }).catch(err => {
            console.error('Error copying access code:', err);
        });
    };

    const handleClearKeys = () => {
        makeApiRequest('delete', `/api/auth/clearGroupKeys?groupname=${groupInfo.groupName}`)
            .then(() => {
                document.querySelector('#generated_code').textContent = "";
                document.querySelector('#copied_message').textContent = "";
                alert('Group keys cleared successfully.');
            })
            .catch(error => {
                console.error('Error clearing group keys:', error);
                alert('Error clearing group keys.');
            });
    };

    return (
        <div className="infobox">
            <div className="left-container">
                <div className="image-label-pair">
                    <FontAwesomeIcon icon={faUsers} size="5x" className="folder" />
                    <h1>{groupInfo.groupName}</h1>
                </div>
                <button className="edit-button" onClick={handleEditClick}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Edit This Group
                </button>
                <br/><br/>
                <button className="btn-three back" onClick={goBack}>
                    <FontAwesomeIcon icon={faCaretLeft} /> Back
                </button>
            </div>
            <div className="group-info">
                <p>Total group connections: {groupInfo.totalConnections}</p>
                <p>Total group members: {groupInfo.totalMembers}</p>
                <p>Total group reports: {groupInfo.totalReports}</p>
                <p>Group owners: {groupInfo.ownerNames.join(', ')}</p><br />
                <h4>Generate an Access Code</h4>
                <label>Code Type</label>
                <select value={codeType} onChange={(e) => setCodeType(e.target.value)}>
                    <option value="ReadOnly">Read Only</option>
                    <option value="User">User</option>
                    <option value="Developer">Developer</option>
                </select><br />
                <label>Expires after</label>
                <input type="number" id="duration_num" min="1" max="100" step="1" value={expiresAfter} onChange={(e) => setExpiresAfter(e.target.value)}></input>
                <select value={expiresInUnit} onChange={(e) => setExpiresInUnit(e.target.value)}>
                    <option value="minute">Minutes</option>
                    <option value="hour">Hours</option>
                    <option value="day">Days</option>
                    <option value="week">Weeks</option>
                    <option value="month">Months</option>
                    <option value="never">Never</option>
                </select>
                <br />
                <button className="btn-six" onClick={handleGenerateAccessCode}>Generate Access Code</button><br />
                <p id="generated_code"></p>
                <button className="btn-seven" onClick={handleCopyCode}>Copy</button>
                {isAdmin && (
                    <button className="btn-seven" onClick={handleClearKeys} style={{ marginLeft: '25px' }}>
                        Clear Keys
                    </button>
                )}
                <p id="copied_message"></p>
            </div>
        </div>
    );
};

export default HOC(GroupInformation);
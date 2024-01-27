import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faArrowLeft, faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import HOC from '../components/HOC';

const GroupInformation = ({ goBack, navigate }) => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const groupId = queryParams.get('groupId');
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

    axios.defaults.baseURL = 'https://localhost:7280';

    const fetchReports = async () => {
        try {
            const response = await axios.post('/api/report/GetReportCount', {
                OwnerId: groupId,
                ReportType: 'Group'
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching report count:', error);
            return 0; // Return a default value in case of error
        }
    };

    const processGroupData = async (rawData) => {
        const reports = await fetchReports();

        const transformedData = {
            groupName: rawData.groupName,
            totalConnections: rawData.groupConnectionStrings?.length ?? 0,
            totalMembers: rawData.groupMembers?.length ?? 0,
            totalReports: reports,
            ownerNames: rawData.groupOwners
        };

        setGroupInfo(transformedData);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            const decoded = jwt_decode(token);
            axios.get(`/api/group/GetGroupById?groupId=${groupId}`)
                .then(response => {
                    processGroupData(response.data);
                })
                .catch(error => {
                    console.error('Could not fetch group info:', error);
                });
        }
    }, [groupId, navigate]);

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
                <select>
                    <option value="ReadOnly">Read Only</option>
                    <option value="User">User</option>
                    <option value="Developer">Developer</option>
                </select><br/>
                <label>Expires after</label>
                <input type="number" id="duration_num" min="1" max="100" step="1" value="1"></input>
                <select>
                    <option value="minute">Minutes</option>
                    <option value="hour">Hours</option>
                    <option value="day">Days</option>
                    <option value="week">Weeks</option>
                    <option value="month">Months</option>
                    <option value="never">Never</option>
                </select>
                <br />
                <button className="btn-six" onclick="">Generate Access Code</button><br />
                <p id="generated_code"></p>
                <button className="btn-seven" onClick="">Copy</button>
                <p id="copied_message"></p>
                <i id="code_duration"></i>
            </div>
        </div>
    );
};

export default HOC(GroupInformation);
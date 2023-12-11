import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile, faCaretLeft, faPeopleRoof } from '@fortawesome/free-solid-svg-icons';

const Reports = () => {
    const [folders, setFolders] = useState([]);
    const [reports, setReports] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isPersonal = searchParams.get('isPersonal');
    const folderId = searchParams.get('folderId');
    axios.defaults.baseURL = 'https://localhost:7280';
    const token = localStorage.getItem('token');
    const decoded = jwt_decode(token);
    const userId = decoded.UserId;

    useEffect(() => {
        axios.all([
            axios.get(`/api/folder/getSubFoldersByParentId?parentId=${folderId}&isPersonal=${isPersonal}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            axios.get(`/api/report/getFolderReports?folderId=${folderId}&isPersonal=${isPersonal}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]).then(axios.spread((folderRes, reportRes) => {
            setFolders(folderRes.data);
            setReports(reportRes.data);
        })).catch(err => console.error('There was an error!', err));
    }, [folderId, userId]);

    const goBack = () => {
        navigate(-1);
    };

    return (
        <div className="sub-container padding-medium">
            <div className="title-style-one">Report Explorer</div>
            <button className="btn-three" onClick={goBack}>
                <FontAwesomeIcon icon={faCaretLeft} /> Back
            </button>
            <hr />
            <div className="grid-container">
                {folders.map((folder, index) => {
                    return (
                        <div key={index} className="image-label-pair grid-item">
                            <FontAwesomeIcon
                                className="folder"
                                icon={folder.isGroupFolder ? faPeopleRoof : faFolder}
                                size="5x"
                                onClick={() => navigate(`/reports?folderId=${folder.id}&isPersonal=false`)}
                            />
                            <label className={folder.isGroupFolder ? "" : "rpf-red"}>
                                {folder.folderName}
                            </label>
                        </div>
                    );
                })}

                {reports.map((report, index) => (
                    <div key={index} className="centered-content">
                        <FontAwesomeIcon icon={faFile} size="3x" />
                        <label>{report.ReportName}</label>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Reports;
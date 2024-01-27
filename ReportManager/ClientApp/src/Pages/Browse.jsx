import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HOC from '../components/HOC';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faPeopleRoof, faFolder, faFile } from '@fortawesome/free-solid-svg-icons';

const Browse = ({ makeApiRequest, navigate, username, userID }) => {
    const [folders, setFolders] = useState([]);
    const [reports, setReports] = useState([]);
    const { folderId, isPersonal } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [folderRes, reportRes] = await Promise.all([
                    makeApiRequest('get', `/api/folder/getSubFoldersByParentId?parentId=${folderId}&isPersonal=${isPersonal}`),
                    makeApiRequest('get', `/api/report/getFolderReports?folderId=${folderId}&isPersonal=${isPersonal}`)
                ]);
                setFolders(folderRes.data);
                setReports(reportRes.data);
            } catch (err) {
                console.error('There was an error!', err);
            }
        };
        fetchData();
    }, [makeApiRequest, folderId, userID, isPersonal]);

    const goBack = () => {
        navigate(-1);
    };

    return (
        <div className="sub-container padding-medium">
            <div className="title-style-one">Your Created Items</div>
            <button className="btn-three back" onClick={goBack}>
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
};

export default HOC(Browse);
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile, faCaretLeft, faPeopleRoof } from '@fortawesome/free-solid-svg-icons';
import HOC from '../components/HOC';

const Reports = ({ env, token, username, userID, makeApiRequest, goBack, navigate }) => {
    const [folders, setFolders] = useState([]);
    const [reports, setReports] = useState([]);

    const searchParams = new URLSearchParams(window.location.search);
    const isPersonal = searchParams.get('isPersonal');
    const folderId = searchParams.get('folderId');

    useEffect(() => {
        // Fetch subfolders
        makeApiRequest('get', `/api/folder/getSubFoldersByParentId?parentId=${folderId}&isPersonal=${isPersonal}`)
            .then((folderRes) => {
                setFolders(folderRes.data);
            })
            .catch((err) => console.error('There was an error fetching folders!', err));

        // Fetch reports
        makeApiRequest('get', `/api/report/getFolderReports?folderId=${folderId}&isPersonal=${isPersonal}`)
            .then((reportRes) => {
                setReports(reportRes.data);
            })
            .catch((err) => console.error('There was an error fetching reports!', err));
    }, [folderId, isPersonal, makeApiRequest]);

    return (
        <div className="sub-container padding-medium">
            <div className="title-style-one">Report Explorer</div>
            <button className="btn-three back" onClick={goBack}>
                <FontAwesomeIcon icon={faCaretLeft} /> Back
            </button>
            <hr />
            <div className="grid-container">
                {folders.map((folder, index) => (
                    <div key={index} className="image-label-pair grid-item">
                        <FontAwesomeIcon
                            className="folder"
                            icon={folder.isGroupFolder ? faPeopleRoof : faFolder}
                            size="5x"
                            onClick={() => navigate(`/reports?folderId=${folder.id}&isPersonal=false`)}
                        />
                        <label className={folder.isGroupFolder ? '' : 'rpf-red'}>{folder.folderName}</label>
                    </div>
                ))}

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

export default HOC(Reports);
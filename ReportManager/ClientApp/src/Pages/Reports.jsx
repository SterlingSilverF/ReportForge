import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile, faCaretLeft, faPeopleRoof, faPencil } from '@fortawesome/free-solid-svg-icons';
import HOC from '../components/HOC';
import LoadingComponent from '../components/loading';

const Reports = ({ userID, makeApiRequest, goBack, navigate }) => {
    const [folders, setFolders] = useState([]);
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const searchParams = new URLSearchParams(window.location.search);
    const isPersonal = searchParams.get('isPersonal');
    const folderId = searchParams.get('folderId');

    useEffect(() => {
        if (userID) {
            setIsLoading(true);
            setLoadingMessage('Fetching reports...');

            if (folderId) {
                // Fetch subfolders and reports for a specific folder
                Promise.all([
                    makeApiRequest('get', `/api/folder/getSubFoldersByParentId?parentId=${folderId}&type=${isPersonal}`),
                    makeApiRequest('get', `/api/report/getFolderReports?folderId=${folderId}&type=${isPersonal}`)
                ])
                    .then(([folderRes, reportRes]) => {
                        setFolders(folderRes.data);
                        setReports(reportRes.data);
                        setIsLoading(false);
                        setLoadingMessage('');
                    })
                    .catch(err => {
                        console.error('There was an error fetching folders and reports!', err);
                        setLoadingMessage('Failed to load folders and reports.');
                        setIsLoading(false);
                    });
            } else {
                // Fetch all user-related reports when no specific folder is selected
                makeApiRequest('get', `/api/report/getAllUserRelatedReports?userId=${userID}`)
                    .then(reportRes => {
                        setReports(reportRes.data);
                        setIsLoading(false);
                        setLoadingMessage('');
                    })
                    .catch(err => {
                        console.error('There was an error fetching reports!', err);
                        setLoadingMessage('Failed to load reports.');
                        setIsLoading(false);
                    });
            }
        }
    }, [userID, folderId, isPersonal, makeApiRequest]);

    return (
        <div className="sub-container padding-medium">
            <div className="title-style-one">Report Explorer</div>
            <LoadingComponent isLoading={isLoading} message={loadingMessage} />
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
                            onClick={() => navigate(`/reports?folderId=${folder.id}&isPersonal=${isPersonal}`)}
                        />
                        {!folder.isGroupFolder && (
                            <FontAwesomeIcon
                                className="folder-edit"
                                icon={faPencil}
                                size="1x"
                                onClick={() => navigate(`/folderform?folderId=${folder.id}&isPersonal=${isPersonal}`)}
                            />
                        )}
                        <label className={folder.isGroupFolder ? '' : 'rpf-red'}>{folder.folderName}</label>
                    </div>
                ))}
                {reports.map((report, index) => (
                    <div key={index} className="image-label-pair clickable" onClick={() => navigate(`/reportinformation?reportId=${report.id}&isPersonal=${isPersonal}`)}>
                        <FontAwesomeIcon icon={faFile} size="3x" className="rpf-silverblue report" />
                        <label>{report.reportName}</label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HOC(Reports);
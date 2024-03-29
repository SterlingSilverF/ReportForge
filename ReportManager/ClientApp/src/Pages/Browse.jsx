import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import HOC from '../components/HOC';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faPeopleRoof, faFolder, faFile, faPencil } from '@fortawesome/free-solid-svg-icons';

const Browse = ({ makeApiRequest, username, navigate }) => {
    const [folders, setFolders] = useState([]);
    const [reports, setReports] = useState([]);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isPersonal = searchParams.get('isPersonal');
    let folderId = searchParams.get('folderId'); 

    useEffect(() => {
        if (username) {
            if (isPersonal === 'true') {
                fetchPersonalBaseFolderId(username);
            } else {
                folderId = "TOP";
            }
        }
    }, [makeApiRequest, username, isPersonal]);


    const fetchPersonalBaseFolderId = async (username) => {
        try {
            const res = await makeApiRequest('get', `/api/folder/getPersonalFolders?username=${username}`);
            const baseFolder = res.data.find(folder => folder.folderName === username);
            if (baseFolder) {
                fetchSubFoldersAndReports(baseFolder.id, isPersonal);
            }
        } catch (err) {
            console.error('Error fetching personal base folder:', err);
        }
    };

    useEffect(() => {
        if (folderId && isPersonal) {
            fetchSubFoldersAndReports(folderId, isPersonal);
        }
    }, [makeApiRequest, folderId, isPersonal]);

    const fetchSubFoldersAndReports = async (folderId, isPersonal) => {
        try {
            var collection = isPersonal === 'true' ? "Personal" : "Group";
            const [folderRes, reportRes] = await Promise.all([
                makeApiRequest('get', `/api/folder/getSubFoldersByParentId?parentId=${folderId}&type=${collection}`),
                makeApiRequest('get', `/api/report/getFolderReports?folderId=${folderId}&type=${isPersonal}`)
            ]);
            setFolders(folderRes.data);
            setReports(reportRes.data);
        } catch (err) {
            console.error('There was an error fetching subfolders and reports:', err);
        }
    };

    const goBack = () => {
        navigate(-1);
    };

    return (
        <div className="sub-container padding-medium">
            <div className="title-style-one">
                {isPersonal === 'true' ? 'Your Created Items' : 'Group Items'}
            </div>
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
                        <label className={folder.isGroupFolder ? "" : "rpf-red"}>
                            {folder.folderName}
                        </label>
                    </div>
                ))}

                {reports.map((report, index) => (
                    <div
                        key={index}
                        className="image-label-pair clickable"
                        onClick={() => navigate(`/reportinformation?reportId=${report.id}&isPersonal=${isPersonal}`)}>
                        <FontAwesomeIcon icon={faFile} size="3x" className="rpf-silverblue report" />
                        <label>{report.reportName}</label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HOC(Browse);
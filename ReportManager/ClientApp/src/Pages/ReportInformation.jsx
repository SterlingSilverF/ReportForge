import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faArrowLeft, faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import HOC from '../components/HOC';

const ReportInformation = ({ makeApiRequest, goBack, navigate, username }) => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const reportId = queryParams.get('reportId');
    const isPersonal = queryParams.get('isPersonal') === 'true';
    const type = isPersonal ? 'Personal' : 'Group';
    const [reportInfo, setReportInfo] = useState({
        id: '',
        reportName: '',
        description: '',
        creatorName: '',
        createdDate: '',
        lastModifiedDate: '',
        lastModifiedByName: '',
        ownerName: '',
        ownerType: ''
    });

    const handleEditClick = () => {
        const type = reportInfo.ownerType;
        navigate(`/reportform?reportId=${reportId}&type=${type}`);
    };

    const processReportData = async () => {
        if (username) {
            try {
                const rawData = await makeApiRequest('get', `/api/report/GetReportById?reportId=${reportId}&type=${type}`);

                const transformedData = {
                    id: rawData.data.id,
                    reportName: rawData.data.reportName,
                    description: rawData.data.description,
                    creatorName: rawData.data.creatorName,
                    createdDate: rawData.data.createdDate,
                    lastModifiedDate: rawData.data.lastModifiedDate,
                    lastModifiedByName: rawData.data.lastModifiedByName,
                    ownerName: rawData.data.ownerName,
                    ownerType: rawData.data.ownerType
                };

                setReportInfo(transformedData);
            } catch (error) {
                console.error('Could not fetch report info:', error);
            }
        }
    };

    useEffect(() => {
        if (reportId) {
            processReportData();
        }
    }, [reportId, username]);

    return (
        <div className="infobox">
            <div className="left-container">
                <div className="image-label-pair">
                    <FontAwesomeIcon icon={faFile} size="5x" className="folder" />
                    <h1>{reportInfo.reportName}</h1>
                </div>
                <button className="edit-button" onClick={handleEditClick}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Edit This Report
                </button>
                <br /><br />
                <button className="btn-three back" onClick={goBack}>
                    <FontAwesomeIcon icon={faCaretLeft} /> Back
                </button>
            </div>
            <div className="report-info">
                <div className="report-info-labels">
                    <p>Description:</p>
                    <p>Created By:</p>
                    <p>Created At:</p>
                    <p>Last Modified At:</p>
                    <p>Last Modified By:</p>
                    <p>Owner Type:</p>
                    <p>Owner:</p>
                </div>
                <div className="report-info-values">
                    <p>{reportInfo.description}</p>
                    <p>{reportInfo.creatorName}</p>
                    <p>{reportInfo.createdDate}</p>
                    <p>{reportInfo.lastModifiedDate}</p>
                    <p>{reportInfo.lastModifiedByName}</p>
                    <p>{reportInfo.ownerType}</p>
                    <p>{reportInfo.ownerName}</p>
                </div>
            </div>
        </div>
    );
};

export default HOC(ReportInformation);
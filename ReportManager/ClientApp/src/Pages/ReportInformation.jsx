﻿import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faArrowLeft, faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import HOC from '../components/HOC';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';

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
        ownerType: '',
        folderPath: ''
    });

    const [reportFiles, setReportFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [copySuccess, setCopySuccess] = useState('');

    const handleEditClick = () => {
        const type = reportInfo.ownerType;
        navigate(`/reportform?reportId=${reportId}&type=${type}`);
    };

    const processReportData = async () => {
        if (username && reportId) {
            let data = null;
            const isPersonalParam = queryParams.get('isPersonal');

            const fetchReportData = async (type) => {
                try {
                    const response = await makeApiRequest('get', `/api/report/GetReportById?reportId=${reportId}&type=${type}`);
                    if (response.data && Object.keys(response.data).length > 0) {
                        return response.data;
                    }
                    return null;
                } catch (error) {
                    if (error.response && error.response.status === 404) {
                        console.log(`${type} report not found, ignoring 404 error.`);
                        return null;
                    } else {
                        console.error('Could not fetch report info:', error);
                        return null;
                    }
                }
            };

            if (isPersonalParam == "null") {
                data = await fetchReportData('Group') || await fetchReportData('Personal');
            } else {
                const type = isPersonalParam === 'true' ? 'Personal' : 'Group';
                data = await fetchReportData(type);
            }

            if (data) {
                const transformedData = {
                    id: data.id,
                    reportName: data.reportName,
                    description: data.description,
                    creatorName: data.creatorName,
                    createdDate: data.createdDate,
                    lastModifiedDate: data.lastModifiedDate,
                    lastModifiedByName: data.lastModifiedByName,
                    ownerName: data.ownerName,
                    ownerType: data.ownerType,
                    folderPath: data.folderPath
                };
                setReportInfo(transformedData);
            }
        }
    };

    useEffect(() => {
        const fetchFilesInFolder = async () => {
            try {
                const startDate = dateRange.startDate ? dateRange.startDate.toISOString() : '';
                const endDate = dateRange.endDate ? dateRange.endDate.toISOString() : '';
                const url = `/api/folder/GetFilesInFolder?folderPath=${reportInfo.folderPath}&startDate=${startDate}&endDate=${endDate}`;
                //console.log("Requesting:", url);
                const response = await makeApiRequest('get', url);
                if (response.data && response.data.length > 0) {
                    setReportFiles(response.data);
                } else {
                    console.log("No files found.");
                }
            } catch (error) {
                console.error('Could not fetch files in folder:', error);
            }
        };

        if (reportInfo.folderPath && dateRange) {
            fetchFilesInFolder();
        }
    }, [reportInfo.folderPath, dateRange]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess('Copied to clipboard!');
            setTimeout(() => setCopySuccess(''), 3000);
        }, (err) => {
            console.error('Failed to copy: ', err);
        });
    };

    const downloadReport = async (fileId) => {
        if (!fileId) {
            console.error('No file selected');
            return;
        }

        const file = reportFiles.find(f => f.id === fileId);
        if (file) {
            try {
                // For some reason, using HOC breaks this so we do it directly instead
                const url = `/api/folder/DownloadFile`;
                const requestBody = {
                    filePath: file.filePath
                };

                const response = await axios.get(url, {
                    params: requestBody,
                    responseType: 'blob'
                });

                if (response.status === 200) {
                    const blob = new Blob([response.data], { type: response.headers['content-type'] });
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const hiddenLink = document.createElement('a');
                    hiddenLink.href = downloadUrl;
                    hiddenLink.download = file.name;
                    hiddenLink.style.display = 'none';
                    document.body.appendChild(hiddenLink);
                    hiddenLink.click();
                    window.URL.revokeObjectURL(downloadUrl);
                    document.body.removeChild(hiddenLink);
                } else {
                    console.error('Failed to download the file:', response.status);
                }
            } catch (error) {
                console.error('An error occurred while downloading the file:', error);
            }
        } else {
            console.error('File not found');
        }
    };

    const applyDateFilter = () => {
        if (dateRange.startDate && dateRange.endDate) {
            const filteredFiles = reportFiles.filter(file =>
                new Date(file.date) >= dateRange.startDate && new Date(file.date) <= dateRange.endDate
            );
            setReportFiles(filteredFiles);
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
                <button className="btn-three back" onClick={goBack}>
                    <FontAwesomeIcon icon={faCaretLeft} /> Back
                </button>
            </div>
            <div className="report-info">
                <div className="report-info-item">
                    <p className="report-info-label">Description:</p>
                    <p className="report-info-value">{reportInfo.description}</p>
                </div>
                <div className="report-info-item">
                    <p className="report-info-label">Created By:</p>
                    <p className="report-info-value">{reportInfo.creatorName}</p>
                </div>
                <div className="report-info-item">
                    <p className="report-info-label">Created At:</p>
                    <p className="report-info-value">{reportInfo.createdDate}</p>
                </div>
                <div className="report-info-item">
                    <p className="report-info-label">Last Modified At:</p>
                    <p className="report-info-value">{reportInfo.lastModifiedDate}</p>
                </div>
                <div className="report-info-item">
                    <p className="report-info-label">Last Modified By:</p>
                    <p className="report-info-value">{reportInfo.lastModifiedByName}</p>
                </div>
                <div className="report-info-item">
                    <p className="report-info-label">Owner Type:</p>
                    <p className="report-info-value">{reportInfo.ownerType}</p>
                </div>
                <div className="report-info-item">
                    <p className="report-info-label">Owner:</p>
                    <p className="report-info-value">{reportInfo.ownerName}</p>
                </div>
            </div>
            <div className="info-two">
                {reportInfo.folderPath && (
                    <div>
                        <h5>
                            Report Storage Path:
                            <span
                                style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                                onClick={() => copyToClipboard(`${reportInfo.folderPath}`)}>
                                {reportInfo.folderPath}
                            </span>
                        </h5>
                        {copySuccess && <p style={{ color: 'green' }}>{copySuccess}</p>}
                    </div>
                )}

                <br />
                <div className="file-download-section">
                    <h5>Download Report</h5>
                    <div className="date-range-filter">
                        <DatePicker
                            selected={dateRange.startDate}
                            onChange={date => setDateRange(prev => ({ ...prev, startDate: date }))}
                            selectsStart
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            placeholderText="Start Date"
                        />
                        <DatePicker
                            selected={dateRange.endDate}
                            onChange={date => setDateRange(prev => ({ ...prev, endDate: date }))}
                            selectsEnd
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            placeholderText="End Date"
                        />
                        <button onClick={applyDateFilter} className="btn-eight">Filter</button>
                        <br /><br />
                        <p>Saved Ran Reports</p>
                        <select
                            value={selectedFile}
                            onChange={e => setSelectedFile(e.target.value)}
                            className="input-style-default standard-select"
                            style={{ marginRight: '20px' }}>
                            <option value="" disabled>--Select a file--</option>
                            {reportFiles.map(file => (
                                <option key={file.id} value={file.id}>{file.name}</option>
                            ))}
                        </select>
                        <button onClick={() => downloadReport(selectedFile)} className="btn-six">Download</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HOC(ReportInformation);
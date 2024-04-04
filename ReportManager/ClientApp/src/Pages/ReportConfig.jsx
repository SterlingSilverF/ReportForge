import React, { useEffect, useState, useRef } from 'react';
import HOC from '../components/HOC';
import { useReportForm } from '../contexts/ReportFormContext';
import LoadingComponent from '../components/loading';
import { useLocation } from 'react-router-dom';

const ReportConfig = ({ makeApiRequest, navigate, userID }) => {
    const { reportFormContext, updateReportFormData } = useReportForm();
    const [isEditMode, setIsEditMode] = useState(false);
    const [status, setStatus] = useState('loading'); // loading, ready, error
    const [action, setAction] = useState('create');
    const [message, setMessage] = useState('');
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const reportId = queryParams.get('reportId');

    useEffect(() => {
        if (reportId) {
            setIsEditMode(true);
        }
    }, [reportId]);

    const handleBackToDesigner = () => {
        const url = '/reportdesigner';
        const queryParams = reportId !== null ? `?reportId=${reportId}` : '';
        navigate(`${url}${queryParams}`);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateReportFormData({ [name]: value });
    };

    const toPascalCase = (str) => str.charAt(0).toUpperCase() + str.slice(1)
    const keysToPascalCase = (obj) => {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                value = keysToPascalCase(value);
            } else if (Array.isArray(value)) {
                value = value.map(item => typeof item === 'object' ? keysToPascalCase(item) : item);
            }
            acc[toPascalCase(key)] = value;
            return acc;
        }, {});
    };

    const omitKeys = (obj, keysToOmit) => {
        return Object.keys(obj).reduce((acc, key) => {
            if (!keysToOmit.includes(key)) {
                acc[key] = obj[key];
            }
            return acc;
        }, {});
    };

    const handleSave = () => {
        const body = keysToPascalCase(reportFormContext);
        const requestBody = {
            ...body,
            Filters: body.Filters.map(filter => omitKeys(filter, ['ColumnOptions'])),
            OrderBys: body.OrderBys.map(orderBy => omitKeys(orderBy, ['ColumnOptions'])),
            UserId: userID
        };

        const formattedString = JSON.stringify(requestBody, null, 2);
        console.log(formattedString);
        const httpMethod = isEditMode && reportId !== null ? 'put' : 'post';
        const apiEndpoint = isEditMode && reportId !== null ? '/api/report/updateReport' : '/api/report/createReport';

        makeApiRequest(httpMethod, apiEndpoint, requestBody)
            .then((response) => {
                setMessage(isEditMode ? "Report updated successfully." : "Report created successfully.");
            })
            .catch((error) => {
                setMessage(isEditMode ? "Failed to update report." : "Failed to create report.");
                console.error(isEditMode ? "Error updating report:" : "Error creating report:", error);
            });
    };

    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Edit Report Configuration</h1>
            </div>
            <section className="report-form-box small-div">
            <hr/>
                <div>
                    <h5>Report Name:</h5>
                    <p>{reportFormContext.reportName}</p>
                    <label>Description:</label><br />
                    <p>{reportFormContext.reportDescription}</p>
                    <br/>
                    <h5>Automatic Report Creation</h5>
                    <label>Select Output Format:</label>
                    <select name="outputFormat" value={reportFormContext.outputFormat} onChange={handleInputChange}>
                        <option value="csv">CSV</option>
                        <option value="xlsx">Excel</option>
                        <option value="json">JSON</option>
                        <option value="txt">Text</option>
                        <option value="pdf">PDF</option>
                    </select>
                    <br />

                    <label>Select Report Frequency: Every</label>
                    <input type="number" name="reportFrequencyValue" min="1" value={reportFormContext.reportFrequencyValue || ''} className="input-style-mini" onChange={handleInputChange} />

                    <select name="reportFrequencyType" value={reportFormContext.reportFrequencyType} onChange={handleInputChange}>
                        <option value="daily">Days</option>
                        <option value="weekly">Weeks</option>
                        <option value="monthly">Months</option>
                        <option value="quarterly">Quarters</option>
                        <option value="yearly">Years</option>
                    </select>
                    <br />

                    <label>At</label>
                    <input type="time" name="reportGenerationTime" value={reportFormContext.reportGenerationTime || ''} onChange={handleInputChange} />
                    <br /><br /><br />

                    <h5>Emailing</h5>
                    <label>Automatically email reports?</label>
                    <select id="emailReports" name="emailReports" value={reportFormContext.emailReports} onChange={handleInputChange}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </select>
                    <br /><br />

                    <label htmlFor="recipients">Recipients (separate each by a semicolon):</label>
                    <input type="text" id="recipients" name="emailRecipients" value={reportFormContext.emailRecipients || ''} className="input-style-long" onChange={handleInputChange} />
                    <br /><br />
                    <a>{message}</a>
                </div>
                <hr/>
            </section>
            <div style={{ textAlign: "center" }}>
                <button onClick={handleBackToDesigner} className="btn-six large-font">Report Designer</button>
                <button className="btn-six large-font" style={{ marginLeft: "10px" }} onClick={handleSave}>Save Report</button>
            </div>
        </div>
    );
};

export default HOC(ReportConfig);
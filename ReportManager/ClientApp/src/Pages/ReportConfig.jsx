import React, { useEffect, useState, useRef } from 'react';
import HOC from '../components/HOC';
import { useReportForm } from '../contexts/ReportFormContext';
import LoadingComponent from '../components/loading';

const ReportConfig = ({ makeApiRequest, navigate, userID }) => {
    const { reportFormContext, updateReportFormData } = useReportForm();
    const [status, setStatus] = useState('loading'); // loading, ready, error
    const [action, setAction] = useState('create');
    const [message, setMessage] = useState('');

    const handleBackToDesigner = () => {
        navigate('/reportdesigner');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateReportFormData({ [name]: value });
    };

    const toPascalCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);

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
        const adjustedReportFormContext = {
            ...reportFormContext,
            reportType: reportFormContext.reportType === 'User' ? 'Personal' : 'Group',
        };
        const body = keysToPascalCase(adjustedReportFormContext);

        const requestBody = {
            ...body,
            Filters: body.Filters.map(filter => omitKeys(filter, ['ColumnOptions'])),
            OrderBys: body.OrderBys.map(orderBy => omitKeys(orderBy, ['ColumnOptions'])),
            Action: action,
            UserId: userID
        };

        const formattedString = JSON.stringify(requestBody, null, 2);
        console.log(formattedString);

        makeApiRequest('post', '/api/report/configureReport', requestBody)
            .then((response) => {
                setMessage("Report configuration saved successfully.");
            })
            .catch((error) => {
                setMessage("Failed to save report configuration.");
                console.error("Error saving report configuration:", error);
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
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                        <option value="quarters">Quarters</option>
                        <option value="years">Years</option>
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
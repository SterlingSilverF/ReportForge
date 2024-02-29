import React, { useEffect, useState, useRef } from 'react';
import HOC from '../components/HOC';
import { useReportForm } from '../contexts/ReportFormContext';
import LoadingComponent from '../components/loading';

const ReportConfig = ({ makeApiRequest, navigate, userID }) => {
    const { reportFormContext, updateReportFormData } = useReportForm();
    const [status, setStatus] = useState('loading'); // loading, ready, error

    const handleBackToDesigner = () => {
        navigate('/reportdesigner');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateReportFormData({ [name]: value });
    };

    const handleSave = () => {
        const requestBody = {
            ...reportFormContext,
            Action: action,
            UserId: userID
        };

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
                    <input
                        type="text"
                        value={reportFormContext.reportName}
                        onChange={handleInputChange}
                        className="input-style-medium"
                    /><br />
                    <label>Description:</label><br />
                    <textarea
                        value={reportFormContext.reportDescription}
                        onChange={handleInputChange}
                        className="input-style-long"
                    />
                    <br /><br /><br />
                    <h5>Automatic Report Creation</h5>
                    <label>Select Output Format:</label>
                    <select name="outputFormat" value={reportFormContext.outputFormat} onChange={handleInputChange}>
                        <option value="csv">CSV</option>
                        <option value="excel">Excel</option>
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
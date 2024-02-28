import React, { useEffect, useState, useRef } from 'react';
import HOC from '../components/HOC';
import { useReportForm } from '../contexts/ReportFormContext';
import LoadingComponent from '../components/loading';

const ReportConfig = ({ makeApiRequest, navigate }) => {
    const { reportFormContext } = useReportForm();
    const [status, setStatus] = useState('loading'); // loading, ready, error

    const handleBackToDesigner = () => {
        navigate('/reportdesigner');
    };

    const handleSave = () => {
        
    };

    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Report Configuration</h1>
            </div>
            <section className="report-form-box small-div">
            <div>
                    <h5>Report Name: {reportFormContext.reportName}</h5>
                    <br />
                        <h5>Automatic Report Creation</h5>
                        <label>Select Output Format:</label>
                        <select>
                            <option value="csv">CSV</option>
                            <option value="excel">Excel</option>
                            <option value="json">JSON</option>
                            <option value="txt">Text</option>
                            <option value="pdf">PDF</option>
                    </select>
                        <br/>
                        <label>Select Report Frequency:</label>
                            <input type="number" name="frequencyValue" min="1" className="input-style-mini"/>
                            <select name="frequencyType">
                                <option value="days">Days</option>
                                <option value="weeks">Weeks</option>
                                <option value="months">Months</option>
                                <option value="quarters">Quarters</option>
                                <option value="years">Years</option>
                            </select><br/>
                        <label>At</label>
                    <input type="time" name="time" />
                    <br /><br/>
                    <h5>Email</h5>
                    <label>Automatically email reports?</label>
                    <select id="emailReports" name="emailReports">
                        <option value="no" selected>No</option>
                        <option value="yes">Yes</option>
                    </select>
                    <br/>
                    <label for="recipients">Recipients:</label>
                    <input type="text" id="recipients" name="recipients" className="input-style-medium"/>
                    </div>
            </section>
            <div style={{ textAlign: "center" }}>
                <button onClick={handleBackToDesigner} className="btn-six large-font">Report Designer</button>
                <button className="btn-six large-font" style={{ marginLeft: "10px" }} onClick={handleSave}>Save Report</button>
            </div>
        </div>
    );
};

export default HOC(ReportConfig);
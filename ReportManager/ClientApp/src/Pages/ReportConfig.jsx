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
            <section className="report-form-box center-headers">
            </section>
            <button onClick={handleBackToDesigner} className="btn-six large-font">Back to Designer</button>
            <button className="btn-six large-font" style={{ marginLeft: "10px" }} onClick={handleSave}>Save Report</button>
        </div>
    );
};

export default HOC(ReportConfig);
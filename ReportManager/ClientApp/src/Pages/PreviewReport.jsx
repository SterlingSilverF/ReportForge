import React, { useEffect, useState } from 'react';
import HOC from '../components/HOC';
import { useReportForm } from '../contexts/ReportFormContext';
import LoadingComponent from '../components/loading';

const PreviewReport = ({ makeApiRequest, navigate }) => {
    const { reportFormContext } = useReportForm();
    const [reportData, setReportData] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading', 'ready', 'error'

    useEffect(() => {
        const fetchReportPreview = async () => {
            if (reportFormContext.reportConfig) {
                try {
                    const response = await makeApiRequest('post', '/api/reports/preview', reportFormContext.reportConfig);
                    setReportData(response.data);
                    setStatus('ready');
                } catch (error) {
                    console.error("Error fetching report preview:", error);
                    setStatus('error');
                }
            } else {
                setStatus('error');
                console.error("Report configuration is missing");
            }
        };

        fetchReportPreview();
    }, [reportFormContext.reportConfig, makeApiRequest]);

    const handleBackToDesigner = () => {
        navigate('/report-designer');
    };

    return (
        <div className="report-preview-container">
            <div className="report-preview-header">
                <h1>Report Preview</h1>
                <button onClick={handleBackToDesigner} className="btn-back">Back to Designer</button>
            </div>
            {status === 'loading' && <LoadingComponent />}
            {status === 'error' && <p>Error loading the report preview. Please try again or adjust your configuration.</p>}
            {status === 'ready' && (
                <div>
                    <h2>Preview Results</h2>
                    {/* Render report data or a table component to display the report */}
                    <div className="report-preview-results">
                        {/* Example rendering - adapt based on actual data structure */}
                        {reportData.map((row, index) => (
                            <div key={index}>
                                {/* Render each row's data */}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HOC(PreviewReport);
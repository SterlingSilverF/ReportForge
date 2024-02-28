import React, { useEffect, useState, useRef } from 'react';
import HOC from '../components/HOC';
import { useReportForm } from '../contexts/ReportFormContext';
import LoadingComponent from '../components/loading';
import { AgGridReact } from 'ag-grid-react';

const PreviewReport = ({ makeApiRequest, navigate }) => {
    const { reportFormContext } = useReportForm();
    const [status, setStatus] = useState('loading'); // loading, ready, error
    const [gridApi, setGridApi] = useState(null);
    const gridRef = useRef(null);
    const [columnDefs, setColumnDefs] = useState([]);
    const [rowData, setRowData] = useState([]);

    const handleExport = (fileType, reportname, data) => {
        if (fileType === 'csv') {
            gridRef.current.api.exportDataAsCsv();
        } else {
            makeApiRequest('post', `/api/exportReport?format=${fileType}&reportname=${reportname}&data=${data}`)
                .then((response) => {
                    if (response.status === 200) {
                        const blob = new Blob([response.data], { type: response.headers['content-type'] });
                        const url = window.URL.createObjectURL(blob);
                        const hiddenLink = document.createElement('a');
                        hiddenLink.href = url;
                        hiddenLink.download = `${reportname}.${fileType}`;
                        hiddenLink.style.display = 'none';
                        document.body.appendChild(hiddenLink);
                        hiddenLink.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(hiddenLink);
                    }
                })
                .catch((error) => {
                    console.error(`Error exporting ${fileType}:`, error);
                });
        }
    };

    const mapData = (formattedData) => {
        if (formattedData && formattedData.length > 0) {
            const columnDefs = Object.keys(formattedData[0]).map(key => ({
                headerName: key.charAt(0).toUpperCase() + key.slice(1),
                field: key
            }));

            setColumnDefs(columnDefs);
            setRowData(formattedData);
        } else {
            setColumnDefs([]);
            setRowData([]);
        }
    };

    useEffect(() => {
        const fetchReportPreview = async () => {
            if (reportFormContext) {
                try {
                    makeApiRequest('post', `/api/database/HandleSql?dbType=${reportFormContext.dbType}&SQL=${reportFormContext.compiledSQL}&connectionId=${reportFormContext.selectedConnection}`)
                        .then((response) => {
                            const formattedData = response.data.map(row => {
                                const rowObj = {};
                                for (const [key, value] of Object.entries(row)) {
                                    rowObj[key] = value;
                                }
                                return rowObj;
                            });
                            mapData(formattedData);
                            setStatus('ready');
                        })
                        .catch((error) => {
                            setStatus('error');
                        });
                    
                } catch (error) {
                    console.error('Error fetching report preview:', error);
                    setStatus('error');
                }
            } else {
                setStatus('error');
                console.error("Report configuration is missing");
            }
        };

        fetchReportPreview();
    }, [reportFormContext, makeApiRequest]);

    const handleBackToDesigner = () => {
        navigate('/reportdesigner');
    };

    const handleProceed = () => {
        navigate('/reportconfig');
    };

    const handleSearch = (e) => {
        const searchTerm = e.target.value;
        gridRef.current.api.setQuickFilter(searchTerm);
    };

    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Report Preview</h1>
            </div>
            <section className="report-form-box center-headers">
            {status === 'loading' && <LoadingComponent />}
            {status === 'error' && <p>Error loading the report preview. Please try again or adjust your configuration.</p>}
            {status === 'ready' && (
                    <div>
                        <div>
                            <h2>Report: {reportFormContext.reportName}</h2>
                            <div className="search-bar-con">
                                <select onChange={(e) => handleExport(e.target.value)} defaultValue="">
                                    <option value="csv">CSV</option>
                                    <option value="excel">Excel</option>
                                    <option value="json">JSON</option>
                                    <option value="txt">Text</option>
                                    <option value="pdf">PDF</option>
                                </select>
                                <button className="btn-eight" onClick={() => handleExport(document.querySelector('select').value)}>Download</button>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="search-bar"
                                onChange={handleSearch}
                            />
                            </div>
                        </div>
                        <div className="report-preview-results ag-theme-alpine" style={{ height: 500, width: '100%' }}>
                            <AgGridReact
                                ref={gridRef}
                                columnDefs={columnDefs}
                                rowData={rowData}
                            />
                        </div>
                </div>
            )}
                
            </section>
            <button onClick={handleBackToDesigner} className="btn-six large-font">Back to Designer</button>
            <button className="btn-six large-font" style={{ marginLeft: "10px" }} onClick={handleProceed}>Proceed to Final Configuration --{'>'}</button>
        </div>
    );
};

export default HOC(PreviewReport);
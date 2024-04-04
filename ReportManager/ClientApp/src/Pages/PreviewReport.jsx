import React, { useEffect, useState, useRef } from 'react';
import HOC from '../components/HOC';
import { useReportForm } from '../contexts/ReportFormContext';
import LoadingComponent from '../components/loading';
import { AgGridReact } from 'ag-grid-react';
import AdvancedSection from "../components/AdvancedSection";
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const PreviewReport = ({ makeApiRequest, navigate, token }) => {
    const { reportFormContext, updateReportFormData } = useReportForm();
    const [status, setStatus] = useState('loading'); // loading, ready, error
    const gridRef = useRef(null);
    const [columnDefs, setColumnDefs] = useState([]);
    const [rowData, setRowData] = useState([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showSQL, setShowSQL] = useState(false);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const reportId = queryParams.get('reportId');


    const handleExport = (fileType) => {
        if (fileType === 'csv') {
            gridRef.current.api.exportDataAsCsv();
        } else {
            const serializedData = JSON.stringify(rowData);
            const requestBody = {
                format: fileType,
                reportname: reportFormContext.reportName,
                data: serializedData
            };
            
            axios.post('/api/report/exportReport', requestBody, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                responseType: 'blob'
            })
                .then((response) => {
                    if (response.status === 200) {
                        const blob = new Blob([response.data], { type: response.headers['content-type'] });
                        const url = window.URL.createObjectURL(blob);
                        const hiddenLink = document.createElement('a');
                        const now = new Date();
                        const timestamp = now.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' }).replace(/[/:, ]/g, '_');
                        hiddenLink.href = url;
                        hiddenLink.download = `${reportFormContext.reportName}_${timestamp}.${fileType}`;
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
            const columnDefs = reportFormContext.selectedColumns.map((column, index) => ({
                headerName: column.columnName,
                field: column.columnName,
                sortable: true,
                resizable: true,
                cellClass: 'cell-wrap-text',
                autoHeight: true,
                displayOrder: index + 1,
                columnFormatting: {
                    conversion: 'None',
                    formatValue: null,
                    maxLength: null,
                },
            }));

            setColumnDefs(columnDefs);
            setRowData(formattedData);
        } else {
            setColumnDefs([]);
            setRowData([]);
        }
    };

    const handleColumnDragEnd = (event) => {
        const newColumnDefs = event.columnApi.getAllGridColumns().map((column, index) => ({
            ...column.colDef,
            displayOrder: index + 1,
        }));

        setColumnDefs(newColumnDefs);
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
                                    rowObj[key] = typeof value === 'object' ? '' : value;
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
        const url = '/reportdesigner';
        const queryParams = reportId !== null ? `?reportId=${reportId}` : '';
        navigate(`${url}${queryParams}`);
    };

    const toggleAdvanced = () => {
        setShowAdvanced(!showAdvanced);
    };

    const handleToggleSQL = () => {
        setShowSQL(!showSQL);
    };

    const handleSearch = (e) => {
        const searchTerm = e.target.value;
        gridRef.current.api.setQuickFilter(searchTerm);
    };

    const handleProceed = async () => {
        try {
            await updateSelectedColumnsFromColumnDefs();
            let reportConfigUrl = '/reportconfig';
            if (reportId !== null) {
                reportConfigUrl += `?reportId=${reportId}`;
            }
            navigate(reportConfigUrl);
        } catch (error) {
            console.error('Error updating selected columns:', error);
        }
    };

    const updateSelectedColumnsFromColumnDefs = () => {
        const updatedColumns = columnDefs.map((columnDef) => {
            const existingColumnIndex = reportFormContext.selectedColumns.findIndex(column => column.columnName === columnDef.field);
            const existingColumn = reportFormContext.selectedColumns[existingColumnIndex];

            return {
                ...existingColumn,
                displayOrder: columnDef.displayOrder,
                columnFormatting: {
                    conversion: columnDef.columnFormatting.conversion,
                    formatValue: columnDef.columnFormatting.formatValue,
                    maxLength: columnDef.columnFormatting.maxLength,
                }
            };
        });

        updateReportFormData({ selectedColumns: updatedColumns });
    };

    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Preview and Customization</h1>
            </div>
            <section className="report-form-box center-headers">
            {status === 'loading' && <LoadingComponent />}
            {status === 'error' && <p>Error loading the report preview. Please try again or adjust your configuration.</p>}
                {status === 'ready' && (
                    <div>
                        <div>
                            <div className="search-bar-con">
                                <select defaultValue="">
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
                            <h2>Report: {reportFormContext.reportName}</h2>
                            <p>Drag a column to reorder it.</p>
                        </div>
                        <div className="report-preview-results ag-theme-alpine" style={{ height: 500, width: '100%' }}>
                            <AgGridReact
                                ref={gridRef}
                                columnDefs={columnDefs}
                                rowData={rowData}
                                onColumnMoved={handleColumnDragEnd}
                                defaultColDef={{
                                    sortable: true,
                                    resizable: true,
                                    cellClass: 'cell-wrap-text',
                                    autoHeight: true,
                                }}
                                suppressColumnVirtualisation={true}
                                enableCellTextSelection={true}
                            />
                        </div>
                        <div>
                            <br />
                            <button onClick={toggleAdvanced}
                                className="btn-eight"
                                style={{ marginLeft: "0" }}>
                                {showAdvanced ? 'Hide Advanced' : 'Advanced'}
                            </button>
                            <br /><br />
                            {showAdvanced && <AdvancedSection rowData={rowData} />}
                        </div>
                    </div>
                )}
                <button className="btn-eight btn-restrict" style={{ marginLeft: "0", justifySelf: "start" }} onClick={handleToggleSQL}>
                    {showSQL ? 'Hide SQL' : 'Show SQL'}
                </button>
                <br/>
                {showSQL && (
                    <p>{reportFormContext.compiledSQL}</p>
                )}
            </section>
            <button onClick={handleBackToDesigner} className="btn-six large-font">Back to Designer</button>
            <button className="btn-six large-font" style={{ marginLeft: "10px" }} onClick={handleProceed}>Proceed to Final Configuration --{'>'}</button>
        </div>
    );
};

export default HOC(PreviewReport);
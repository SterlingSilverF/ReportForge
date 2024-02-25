import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import HOC from '../components/HOC';
import { useReportForm } from '../contexts/ReportFormContext';
import DynamicInputs from '../components/dynamicinputs';
import LoadingComponent from '../components/loading';

const ReportDesigner = ({ makeApiRequest, navigate }) => {
    const { reportFormContext, updateReportFormData } = useReportForm();

    const [status, setStatus] = useState('loading'); // 'loading', 'ready', 'error'
    const [tables, setTables] = useState([]);
    const [tableColumns, setTableColumns] = useState({});

    // Joins
    const [joinsInfo, setJoinsInfo] = useState([]);
    const [selectedTableOne, setSelectedTableOne] = useState('');
    const [selectedTableTwo, setSelectedTableTwo] = useState('');
    const [columnsTableOne, setColumnsTableOne] = useState([]);
    const [columnsTableTwo, setColumnsTableTwo] = useState([]);
    const [selectedJoinColumnOne, setSelectedJoinColumnOne] = useState('');
    const [selectedJoinColumnTwo, setSelectedJoinColumnTwo] = useState('');

    // On load
    useEffect(() => {
        const loadDesignerPageData = async () => {
            if (reportFormContext.selectedConnection && reportFormContext.reportType && reportFormContext.dbType) {
                try {
                    var url = `/api/database/LoadDesignerPage?connectionId=${reportFormContext.selectedConnection}&dbType=${reportFormContext.dbType}&ownerType=${reportFormContext.reportType}`
                    const response = await makeApiRequest('post', url);
                    setTables(response.data);
                    setStatus('ready');
                    console.log("Tables loaded successfully.");
                } catch (error) {
                    console.error("Error loading designer page data:", error);
                    setStatus('error');
                }
            }
        };

        loadDesignerPageData();
    }, [reportFormContext.selectedConnection, reportFormContext.reportType, reportFormContext.dbType]);

    // When a table is selected from "Available Tables"
    const handleTableSelect = async (tableName) => {
        const isSelected = reportFormContext.selectedTables.includes(tableName);
        let newSelectedTables;
        if (isSelected) {
            newSelectedTables = reportFormContext.selectedTables.filter(t => t !== tableName);
        } else {
            newSelectedTables = [...reportFormContext.selectedTables, tableName];
            const columns = await fetchTableColumns(tableName, true);
            setTableColumns(prevState => ({ ...prevState, [tableName]: columns }));
        }
        updateReportFormData({ ...reportFormContext, selectedTables: newSelectedTables });
    };

    // When a column is selected from "Availible Tables"
    const handleColumnSelection = (tableName, columnName, isSelected) => {
        const columnDetails = tableColumns[tableName].find(col => col.columnName === columnName);
        let updatedSelectedColumns;
        if (isSelected) {
            updatedSelectedColumns = [...reportFormContext.selectedColumns, { table: tableName, ...columnDetails }];
        } else {
            updatedSelectedColumns = reportFormContext.selectedColumns.filter(col => !(col.table === tableName && col.columnName === columnName));
        }

        updateReportFormData({
            ...reportFormContext,
            selectedColumns: updatedSelectedColumns,
        });
    };

    const fetchTableColumns = async (tableName, withDataTypes = false) => {
        const connectionId = reportFormContext.selectedConnection;
        const dbType = reportFormContext.dbType;
        const ownerType = reportFormContext.reportType;

        const endpoint = withDataTypes
            ? `/api/database/GetAllColumnsWithDT?connectionId=${connectionId}&dbType=${dbType}&tableName=${tableName}${ownerType ? `&ownerType=${ownerType}` : ''}`
            : `/api/database/GetAllColumns?connectionId=${connectionId}&dbType=${dbType}&tableName=${tableName}${ownerType ? `&ownerType=${ownerType}` : ''}`;

        try {
            const response = await makeApiRequest('get', endpoint);
            return response.data;
        } catch (error) {
            console.error(`Error fetching columns for table ${tableName}:`, error);
            return [];
        }
    };

    const renderTableColumns = () => {
        return reportFormContext.selectedTables.map((tableName) => (
            <React.Fragment key={tableName}>
                <li className="table-name">{tableName}</li>
                {tableColumns[tableName]?.map((column) => {
                    const isSelected = reportFormContext.selectedColumns.some(sc => sc.table === tableName && sc.columnName === column.columnName);
                    const columnClassName = `column-detail ${isSelected ? 'selected' : ''}`;

                    return (
                        <li
                            key={column.columnName}
                            className={columnClassName.trim()}
                            onClick={() => handleColumnSelection(tableName, column.columnName, !isSelected)}>
                            <span>{column.columnName} - {column.dataType}</span>
                        </li>
                    );
                })}
            </React.Fragment>
        ));
    };

    // "Join" section dropdown selected: 1
    const handleTableOneJoinChange = async (e) => {
        const tableName = e.target.value;
        setSelectedTableOne(tableName);
        if (tableName) {
            const columns = await fetchTableColumns(tableName);
            setColumnsTableOne(columns);
        } else {
            setColumnsTableOne([]);
        }
    };

    // "Join" section dropdown selected: 2
    const handleTableTwoJoinChange = async (e) => {
        const tableName = e.target.value;
        setSelectedTableTwo(tableName);
        if (tableName) {
            const columns = await fetchTableColumns(tableName);
            setColumnsTableTwo(columns);
        } else {
            setColumnsTableTwo([]);
        }
    };

    function getColumnDataType(columnName, tableName) {
        // Fetch the datatype from the columns listbox or a metadata store
        // Placeholder for actual implementation
        return 'dataType';
    };

    // Checks if datatypes are compatible or if a conversion is possible
    function checkDataTypeCompatibility(type1, type2) {
        // Implement logic to check compatibility or conversion feasibility
        // Return true if compatible or convertible, false otherwise
        return true; // Placeholder return value
    };

    function handleJoinClick() {
        const typeOne = getColumnDataType(selectedJoinColumnOne, selectedTableOne);
        const typeTwo = getColumnDataType(selectedJoinColumnTwo, selectedTableTwo);
        const isValidJoin = checkDataTypeCompatibility(typeOne, typeTwo);

        const joinSelection = {
            tableOne: {
                name: selectedTableOne,
                column: selectedJoinColumnOne,
                dataType: typeOne
            },
            tableTwo: {
                name: selectedTableTwo,
                column: selectedJoinColumnTwo,
                dataType: typeTwo
            },
            isValid: isValidJoin,
        };

        joinsInfo.push(joinSelection);
    }

    // Support function for submission
    const compileReportConfigurations = () => {
        const filterConfig = [];
        const orderByConfig = [];

        const filterCount = document.querySelectorAll('[id^="columnFilter"]').length;
        const orderByCount = document.querySelectorAll('[id^="orderbyColumn"]').length;

        for (let i = 1; i <= filterCount; i++) {
            filterConfig.push({
                column: document.getElementById(`columnFilter${i}`).value,
                condition: document.getElementById(`condition${i}`).value,
                value: document.getElementById(`filterValue${i}`).value,
            });
        }

        for (let i = 1; i <= orderByCount; i++) {
            orderByConfig.push({
                column: document.getElementById(`orderbyColumn${i}`).value,
                order: document.getElementById(`orderbyAscDesc${i}`).value,
            });
        }

        return { filterConfig, orderByConfig };
    };

    // Final function
    const submitReportConfig = async () => {
        const { filterConfig, orderByConfig } = compileReportConfigurations();

        try {
            const response = await makeApiRequest('post', '/api/reports/buildAndVerifySql', reportFormContext);
            // Handle success, e.g., navigate to the preview page with the response data
            // Possibly using something like React Router for navigation
        } catch (error) {
            console.error("Error submitting report configuration:", error);
            // Handle error
        }
    };

    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Report Designer</h1>
                <hr />
            </div>
            <section className="report-form-box center-headers">
                <div className="form-element">
                    <h5>Welcome to the report designer!</h5>
                    <p>Here you'll set up what data you want to see in your report and how.</p>
                    <p>To start, you must select tables that you think may contain relevant data. Once a table is selected, their columns will appear on the right.</p>
                    <a href="/guides/designer" className="input-style-default">Designer Walkthrough</a><br />
                </div>
                <br />
                <h2>Select Tables</h2>
                <LoadingComponent />
                <div className="flex-grid">
                    <div>
                        <div style={{ flex: 1 }}>
                            <div className="dual-listbox">
                                <div className="listbox-container small-width">
                                    <label htmlFor="tables">Available Tables</label>
                                    <ul className="listbox" id="allTables">
                                        {tables?.map((table) => (
                                            <li key={table} className={reportFormContext.selectedTables.includes(table) ? 'selected' : ''}
                                                onClick={() => handleTableSelect(table)}>{table}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="icon-container" style={{ display: 'flex', alignItems: 'center' }}>
                                    <FontAwesomeIcon icon={faArrowRightLong} size="3x" />
                                </div>
                                <div className="listbox-container large-width">
                                    <label htmlFor="tablecolumns">Available Columns</label>
                                    <ul className="listbox" id="tableColumns">
                                        {renderTableColumns()}
                                    </ul>
                                </div>
                                <br />
                                <div className="explanation-box eb-small" style={{ marginTop: '27px' }}>
                                    <p>Column Name - Data Format</p>
                                    <a href="/guides/columns">Understanding Columns</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <br />
                <h2>Select Shared Columns</h2>
                <div className="flex-grid dual-listbox select-shared" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 auto' }}>
                        <div className="listbox-container">
                            <select id="tableSelectOne" value={selectedTableOne} onChange={handleTableOneJoinChange}>
                                <option value="">--Select a Table--</option>
                                {reportFormContext.selectedTables.filter(table => table !== selectedTableTwo).map((table, index) => (
                                    <option key={index} value={table}>{table}</option>
                                ))}
                            </select>
                            <div>
                                <ul className="listbox" id="tableColSelectOne">
                                    {columnsTableOne.map((column, index) => (
                                        <li key={index} className="radio-item">
                                            <input
                                                type="radio"
                                                name="selectedColumnOne"
                                                value={column}
                                                checked={selectedJoinColumnOne === column}
                                                onChange={(e) => setSelectedJoinColumnOne(e.target.value)}
                                            />{column}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div style={{ flex: '1 1 auto' }}>
                        <div className="listbox-container">
                            <select id="tableSelectTwo" value={selectedTableTwo} onChange={handleTableTwoJoinChange}>
                                <option value="">--Select a Table--</option>
                                {reportFormContext.selectedTables.filter(table => table !== selectedTableOne).map((table, index) => (
                                    <option key={index} value={table}>{table}</option>
                                ))}
                            </select>
                            <div>
                                <ul className="listbox" id="tableColSelectTwo">
                                    {columnsTableTwo.map((column, index) => (
                                        <li key={index} className="radio-item">
                                            <input
                                                type="radio"
                                                name="selectedColumnTwo"
                                                value={column}
                                                checked={selectedJoinColumnTwo === column}
                                                onChange={(e) => setSelectedJoinColumnTwo(e.target.value)}
                                            /> {column}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="explanation-box eb-medium" style={{ flex: '1 1 auto' }}>
                        <p>In order to display data from different tables properly, each table must be joined to the query.</p>
                        <p>Joining is accomplished by indicating shared, but unique valued columns in two individual tables.</p>
                        <p>Usually these are columns that have the same name and are the unique record number or identifier for ONE of the two tables.</p>
                        <a href="/guides/table-joins">Read More</a>
                    </div>
                </div>
                <button type="button" className="report-designer-button" onClick={handleJoinClick}>Join</button>
                <br />
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gridGap: '20px', alignItems: 'start' }}>
                    <div style={{ gridColumn: '1 / 2' }}>
                        <h5>Joined Columns</h5>
                        {joinsInfo.map((join, index) => (
                            <div key={index}>
                                <b>{join.tableOne.name} -> {join.tableTwo.name}</b>
                                <ul>
                                    <li>{join.tableOne.column} = {join.tableTwo.column}</li>
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div style={{ gridColumn: '2 / 3' }}>
                        <h5>Join Valid</h5>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {joinsInfo.map((join, index) => (
                                <li key={index}>
                                    {join.tableOne.name} & {join.tableTwo.name} {join.isValid ? '✅' : '❌'}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <hr />
                    <DynamicInputs fetchTableColumns={fetchTableColumns} />
                <br /><br /><hr />
                <button className="btn-three btn-restrict" onClick={submitReportConfig}>PREVIEW REPORT</button>
            </section>
            <br />
            </div>
    );
};

export default HOC(ReportDesigner);
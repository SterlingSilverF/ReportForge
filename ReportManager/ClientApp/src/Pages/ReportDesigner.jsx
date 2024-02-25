import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import HOC from '../components/HOC';
import { useReportForm } from '../contexts/ReportFormContext';

const ReportDesigner = ({ makeApiRequest, navigate }) => {
    const { reportFormData, updateReportFormData } = useReportForm();

    const [lines, setLines] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading', 'ready', 'error'
    const [tables, setTables] = useState([]);
    const [tableColumns, setTableColumns] = useState({});

    // Joins
    const [selectedTableOne, setSelectedTableOne] = useState('');
    const [selectedTableTwo, setSelectedTableTwo] = useState('');
    const [columnsTableOne, setColumnsTableOne] = useState([]);
    const [columnsTableTwo, setColumnsTableTwo] = useState([]);
    const [selectedJoinColumnOne, setSelectedJoinColumnOne] = useState('');
    const [selectedJoinColumnTwo, setSelectedJoinColumnTwo] = useState('');

    // Filters + Order By
    const [selectedFilterTable, setSelectedFilterTable] = useState('');
    const [filterTableColumns, setFilterTableColumns] = useState([]);
    const [selectedOrderByTable, setSelectedOrderByTable] = useState('');
    const [orderByColumns, setOrderByColumns] = useState([]);
    const [filters, setFilters] = useState([]);
    const [orderBys, setOrderBys] = useState([]);

    // On load
    useEffect(() => {
        const loadDesignerPageData = async () => {
            if (reportFormData.selectedConnection && reportFormData.reportType && reportFormData.dbType) {
                try {
                    var url = `/api/database/LoadDesignerPage?connectionId=${reportFormData.selectedConnection}&dbType=${reportFormData.dbType}&ownerType=${reportFormData.reportType}`
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
    }, [reportFormData.selectedConnection, reportFormData.reportType, reportFormData.dbType]);

    // For "Available Tables" section & dropdown selected in "Join" section
    const fetchTableColumns = async (tableName, withDataTypes = false) => {
        const connectionId = reportFormData.selectedConnection;
        const dbType = reportFormData.dbType;
        const ownerType = reportFormData.reportType;

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

    // When a table is selected from "Available Tables"
    const handleTableSelect = async (tableName) => {
        const isSelected = reportFormData.selectedTables.includes(tableName);
        let newSelectedTables;
        if (isSelected) {
            newSelectedTables = reportFormData.selectedTables.filter(t => t !== tableName);
        } else {
            newSelectedTables = [...reportFormData.selectedTables, tableName];
            const columns = await fetchTableColumns(tableName, true);
            setTableColumns(prevState => ({ ...prevState, [tableName]: columns }));
        }
        updateReportFormData({ ...reportFormData, selectedTables: newSelectedTables });
    };

    // When a column is selected from "Availible Tables"
    const handleColumnSelection = (tableName, columnName, isSelected) => {
        const columnDetails = tableColumns[tableName].find(col => col.columnName === columnName);
        let updatedSelectedColumns;
        if (isSelected) {
            updatedSelectedColumns = [...reportFormData.selectedColumns, { table: tableName, ...columnDetails }];
        } else {
            updatedSelectedColumns = reportFormData.selectedColumns.filter(col => !(col.table === tableName && col.columnName === columnName));
        }

        updateReportFormData({
            ...reportFormData,
            selectedColumns: updatedSelectedColumns,
        });
    };

    const renderTableColumns = () => {
        return reportFormData.selectedTables.map((tableName) => (
            <React.Fragment key={tableName}>
                <li className="table-name">{tableName}</li>
                {tableColumns[tableName]?.map((column) => {
                    const isSelected = reportFormData.selectedColumns.some(sc => sc.table === tableName && sc.columnName === column.columnName);
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

    // Filters + Order By Display Columns
    async function handleTableSelectionChange(e, index, type) {
        const tableName = e.target.value;

        if (type === 'filter') {
            let columns = [];
            if (tableName) {
                columns = await fetchTableColumns(tableName);
            }
            const updatedFilters = filters.map((filter, i) => {
                if (i === index) {
                    return { ...filter, table: tableName, columns: columns.map(column => column) };
                }
                return filter;
            });
            setFilters(updatedFilters);
        } else if (type === 'orderBy') {
            // Update the specific order by with new table
            const updatedOrderBys = orderBys.map((orderBy, i) => {
                if (i === index) {
                    return { ...orderBy, table: tableName };
                }
                return orderBy;
            });
            setOrderBys(updatedOrderBys);
        }
    }

    const addFilter = () => {
        const newFilter = { table: '', column: '', condition: '', value: '' };
        setFilters([...filters, newFilter]);
    };

    const removeFilter = (index) => {
        setFilters(filters.filter((_, i) => i !== index));
    };

    const addOrderBy = () => {
        const newFilter = { table: '', column: '', condition: '', value: '' };
        setOrderBys([...filters, newFilter]);
    };

    const removeOrderBy = (index) => {
        setOrderBys(filters.filter((_, i) => i !== index));
    };

    const calculateGridArea = (index) => {
        const rowStart = 2 + index * 3;
        return `${rowStart} / 2 / ${rowStart + 1} / 6`;
    };

    const renderFilters = () => {
        const filterElements = filters.map((filter, index) => {
            const rowStart = 2 + index * 4;
            const gridAreas = {
                labelTable: `${rowStart} / 2 / ${rowStart + 1} / 3`,
                selectTable: `${rowStart + 1} / 2 / ${rowStart + 2} / 3`,
                labelColumn: `${rowStart} / 3 / ${rowStart + 1} / 4`,
                selectColumn: `${rowStart + 1} / 3 / ${rowStart + 2} / 4`,
                labelCondition: `${rowStart} / 4 / ${rowStart + 1} / 5`,
                selectCondition: `${rowStart + 1} / 4 / ${rowStart + 2} / 5`,
                inputValue: `${rowStart + 1} / 5 / ${rowStart + 2} / 6`,
                buttonRemove: `${rowStart + 2} / 3 / ${rowStart + 3} / 4`,
            };

            return (
                <React.Fragment key={index}>
                    <label style={{ gridArea: gridAreas.labelTable }}>Select Table</label>
                    <select
                        style={{ gridArea: gridAreas.selectTable }}
                        value={filter.table}
                        onChange={(e) => handleTableSelectionChange(e, index, 'filter')}>
                        <option value="">--Select a Table--</option>
                        {reportFormData.selectedTables.map((table, i) => (
                            <option key={i} value={table}>{table}</option>
                        ))}
                    </select>

                    <label style={{ gridArea: gridAreas.labelColumn }}>Select Column</label>
                    <select
                        style={{ gridArea: gridAreas.selectColumn }}
                        value={filter.column}>
                        <option value="">--Select a Column--</option>
                        {(filter.table ? filterTableColumns(filter.table) : []).map((column, i) => (
                            <option key={i} value={column}>{column}</option>
                        ))}
                    </select>

                    <label style={{ gridArea: gridAreas.labelCondition }}>Condition</label>
                    <select
                        style={{ gridArea: gridAreas.selectCondition }}
                        value={filter.condition}>
                        <option value="=">Equals</option>
                        <option value="!=">Not Equal To</option>
                        <option value=">">Greater Than</option>
                        <option value=">=">Greater Than or Equal To</option>
                        <option value="<">Less Than</option>
                        <option value="<=">Less Than or Equal To</option>
                        <option value="Between">Between</option>
                        <option value="In">Contained in List</option>
                    </select>

                    <input
                        type="text"
                        style={{ gridArea: gridAreas.inputValue }}
                        className="input-style-short"
                        value={filter.value}/>

                    <button
                        className="report-designer-button"
                        style={{ gridArea: gridAreas.buttonRemove }}
                        onClick={() => removeFilter(index)}>
                        Remove
                    </button>
                </React.Fragment>
            );
        });

        const addButtonRowStart = 2 + filters.length * 4;

        return (
            <>
                {filterElements}
                <button
                    className="report-designer-button"
                    style={{ gridArea: `${addButtonRowStart} / 2 / ${addButtonRowStart + 1} / 3` }}
                    onClick={addFilter}>
                    Add Filter
                </button>
            </>
        );
    };

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
            const response = await makeApiRequest('post', '/api/reports/buildAndVerifySql', reportFormData);
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
                    <a href="/guides/designer" className="input-style-default">Designer Walkthrough</a><br/>
                </div>
                <br />
                <h2>Select Tables</h2>
                <div className="flex-grid">
                    <div>
                        <div style={{ flex: 1 }}>
                            <div className="dual-listbox">
                                <div className="listbox-container small-width">
                                    <label htmlFor="tables">Available Tables</label>
                                    <ul className="listbox" id="allTables">
                                        {tables?.map((table) => (
                                            <li key={table} className={reportFormData.selectedTables.includes(table) ? 'selected' : ''}
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
                                <div className="explanation-box eb-small" style={{marginTop: '27px' }}>
                                    <p>Column Name - Data Format</p>
                                    <a href="/guides/columns">Understanding Columns</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <br/>
                <h2>Select Shared Columns</h2>
                <div className="flex-grid dual-listbox select-shared" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 auto'}}>
                        <div className="listbox-container">
                            <select id="tableSelectOne" value={selectedTableOne} onChange={handleTableOneJoinChange}>
                                <option value="">--Select a Table--</option>
                                {reportFormData.selectedTables.filter(table => table !== selectedTableTwo).map((table, index) => (
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
                    <div style={{ flex: '1 1 auto'}}>
                        <div className="listbox-container">
                            <select id="tableSelectTwo" value={selectedTableTwo} onChange={handleTableTwoJoinChange}>
                                <option value="">--Select a Table--</option>
                                {reportFormData.selectedTables.filter(table => table !== selectedTableOne).map((table, index) => (
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
                    <div className="explanation-box eb-medium" style={{ flex: '1 1 auto'}}>
                        <p>In order to display data from different tables properly, each table must be joined to the query.</p>
                        <p>Joining is accomplished by indicating shared, but unique valued columns in two individual tables.</p>
                        <p>Usually these are columns that have the same name and are the unique record number or identifier for ONE of the two tables.</p>
                        <a href="/guides/table-joins">Read More</a>
                    </div>
                </div>
                <button type="button" className="report-designer-button" onClick="">Join</button>
                <br/>
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gridGap: '20px', alignItems: 'start' }}>
                    <div style={{ gridColumn: '1 / 2' }}>
                        <h5>Joined Columns</h5>
                        <b>Table1 -&gt; Table2</b>
                        <ul><li>Column 1 = Column 2</li></ul>
                        <b>Table2 -&gt; Table3</b>
                        <ul><li>Column 1 = Column 2</li>
                        <li>Column 3 = Column 4</li>
                        </ul>
                    </div>

                    <div style={{ gridColumn: '2 / 3' }}>
                        <h5>Join Valid</h5>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {reportFormData.selectedTables.map((table, index) => (
                                <li key={index}>
                                    {table} { /* Dynamically determine and render checkmark or X based on status */}
                                    {Math.random() > 0.5 ? '✅' : '❌'}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <hr/>
                <div className="grid">
                    <h4 style={{ gridArea: '1 / 1 / 2 / 6' }}>Filters and Conditions</h4>
                    <div className="explanation-box" style={{ gridArea: '2 / 1 / 5 / 2' }}>
                        <p>What kind of data do you want to include or exclude?</p>
                        <a href="/guides/conditionals">Read More</a>
                    </div>

                    <label style={{ gridArea: '2 / 2 / 3 / 3' }}>Select Table</label>
                    <select style={{ gridArea: '3 / 2 / 4 / 3' }} id="tableFilter1" onChange={(e) => handleTableSelectionChange(e, setFilterTableColumns)}>
                        <option value="">--Select a Table--</option>
                        {reportFormData.selectedTables.map((table, index) => (
                            <option key={index} value={table}>{table}</option>
                        ))}
                    </select>
                    <button className="report-designer-button" style={{ gridArea: '4 / 2 / 5 / 3' }} onClick="">Add</button>

                    <label style={{ gridArea: '2 / 3 / 3 / 4' }}>Select Column</label>
                    <select style={{ gridArea: '3 / 3 / 4 / 4' }} id="columnFilter1">
                        <option value="">--Select a Column--</option>
                        {filterTableColumns.map((column, index) => (
                            <option key={index} value={column}>{column}</option>
                        ))}
                    </select>

                    <label style={{ gridArea: '2 / 4 / 3 / 5' }}>Condition</label>
                    <select style={{ gridArea: '3 / 4 / 4 / 5' }} id="condition1">
                        <option value="=">Equals</option>
                        <option value="!=">Not Equal To</option>
                        <option value=">">Greater Than</option>
                        <option value=">=">Greater Than or Equal To</option>
                        <option value="<">Less Than</option>
                        <option value="<=">Less Than or Equal To</option>
                        <option value="Between">Between</option>
                        <option value="In">Contained in List</option>
                    </select>
                    <button className="report-designer-button" style={{ gridArea: '4 / 3 / 5 / 4' }} onClick="">Remove</button>

                    <label style={{ gridArea: '2 / 5 / 3 / 6' }}>Value</label>
                    <input type="text" style={{ gridArea: '3 / 5 / 4 / 6' }} className="input-style-short" id="filterValue1"></input>

                    <div style={{ gridArea: '5 / 1 / 6 / 6', height: '40px' }}></div>

                    <h4 style={{ gridArea: '6 / 1 / 7 / 6' }}>Order By</h4>
                    <div className="explanation-box eb-mini" style={{ gridArea: '7 / 1 / 8 / 2' }}>
                        <p>Display what kind of data first?</p>
                    </div>
                    <select style={{ gridArea: '7 / 2 / 8 / 3' }} id="orderbyTable1" onChange={(e) => handleTableSelectionChange(e, setOrderByColumns)}>
                        <option value="">--Select a Table--</option>
                        {reportFormData.selectedTables.map((table, index) => (
                            <option key={index} value={table}>{table}</option>
                        ))};
                    </select>
                    <select style={{ gridArea: '7 / 3 / 8 / 4' }} id="orderbyColumn1">
                        <option value="">--Select a Column--</option>
                        {orderByColumns.map((column, index) => (
                            <option key={index} value={column}>{column}</option>
                        ))}
                    </select>
                    <select style={{ gridArea: '7 / 4 / 8 / 5' }} id="orderbyAscDesc1">
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                    <button className="report-designer-button" style={{ gridArea: '8 / 2 / 9 / 3' }} onClick="">Add</button>
                    <button className="report-designer-button" style={{ gridArea: '8 / 3 / 9 / 4' }} onClick="">Remove</button>
                </div>
                <br/><br/><hr/>
                <button className="btn-three btn-restrict" onClick={submitReportConfig}>PREVIEW REPORT</button>
            </section>
            <br/>
        </div>
    );
};

export default HOC(ReportDesigner);
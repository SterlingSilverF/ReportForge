import React, { useState, useEffect } from 'react';
import HOC from '../components/HOC';
import DBConnectionModel from '../models/databaseconnectionmodel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';

const ReportDesigner = () => {
    const [lines, setLines] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading', 'ready', 'error'
    const [tables, setTables] = useState([]);
    const [selectedTables, setSelectedTables] = useState([]);
    const [tableColumns, setTableColumns] = useState({});
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [joinConfig, setJoinConfig] = useState([]);
    const [filterConfig, setFilterConfig] = useState([]);
    const [orderByConfig, setOrderByConfig] = useState([]);

    const fetchTables = () => {
        makeApiRequest('get', `/api/database/getTables`)
            .then(response => {
                setTables(response.data);
                setStatus('ready');
            })
            .catch(error => {
                console.error("Error fetching tables:", error);
                setStatus('error');
            });
    };

    const fetchTableColumns = (tableName) => {
        makeApiRequest('get', `/api/database/getColumns?tableName=${tableName}`)
            .then(response => {
                setTableColumns(prevState => ({ ...prevState, [tableName]: response.data }));
            })
            .catch(error => {
                console.error(`Error fetching columns for table ${tableName}:`, error);
            });
    };

    const handleTableSelect = (tableName) => {
        setSelectedTables([...selectedTables, tableName]);
        fetchTableColumns(tableName);
    };

    const handleColumnSelect = (table, column) => {
        const columnEntry = { table, column };
        setSelectedColumns(prevColumns => [...prevColumns, columnEntry]);
    };

    const removeSelectedColumn = (table, column) => {
        setSelectedColumns(prevColumns =>
            prevColumns.filter(col => !(col.table === table && col.column === column)));
    };

    const addJoinConfig = (join) => {
        setJoinConfig(prevJoins => [...prevJoins, join]);
    };

    const removeJoinConfig = (index) => {
        setJoinConfig(prevJoins => prevJoins.filter((_, idx) => idx !== index));
    };

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

    const submitReportConfig = () => {
        const { filterConfig, orderByConfig } = compileReportConfigurations();

        const reportConfig = {
            selectedTables,
            selectedColumns,
            joinConfig,
            filterConfig,
            orderByConfig,
        };

        makeApiRequest('post', '/api/reports/buildAndVerifySql', reportConfig)
            .then(response => {
                // Handle success, e.g., navigate to the preview page with the response data
                // Possibly using something like React Router for navigation
            })
            .catch(error => {
                console.error("Error submitting report configuration:", error);
                // Handle error
            });
    };

    const handleSuccess = (message) => {
        console.log("Success:", message);
        // Additional success handling logic here
    };

    const handleError = (error) => {
        console.error("Error:", error);
        // Additional error handling logic here
    };

    const drawLines = () => {
        // Dimensions and positions should be calculated dynamically or passed in via props
        const itemHeight = 20; // Adjust this based on the actual item height including padding
        const padding = 10; // Adjust based on actual padding
        const totalHeight = itemHeight + padding;
        const newLines = [];

        const list1Items = document.getElementById('list1').children;
        const list2Items = document.getElementById('list2').children;
        const list1Offset = list1Items[0]?.getBoundingClientRect().top;
        const list2Offset = list2Items[0]?.getBoundingClientRect().top;

        // Replace with actual logic to determine matching items based on table parameters
        // For demonstration, assuming items are matched by index
        for (let i = 0; i < list1Items.length; i++) {
            for (let j = 0; j < list2Items.length; j++) {
                // Calculate the Y positions of line starts and ends
                const startY = list1Offset + (i * totalHeight) + (itemHeight / 2);
                const endY = list2Offset + (j * totalHeight) + (itemHeight / 2);

                // Only add line if the items "match" based on your conditions
                /*if () {
                    newLines.push(<line key={`line-${i}-${j}`} x1="0" y1={startY} x2="100%" y2={endY} stroke="black" />);
                }*/
            }
        }

        setLines(newLines);
    };

    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Report Designer</h1>
                <hr />
            </div>
            <section className="report-form-box center-headers">
                <div className="form-element">
                    <h5>Weclome to the report designer!</h5>
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
                                        <li>Item 1</li>
                                        <li>Item 2</li>
                                    </ul>
                                </div>
                                <div className="icon-container" style={{ display: 'flex', alignItems: 'center' }}>
                                    <FontAwesomeIcon icon={faArrowRightLong} size="3x" />
                                </div>
                                <div className="listbox-container large-width">
                                    <label htmlFor="tablecolumns">Available Columns</label>
                                    <ul className="listbox" id="tableColumns">
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
                            <select id="tableSelectOne">
                                <option value="">Dropdown 1</option>
                            </select>
                            <div>
                                <ul className="listbox" id="tableColSelectOne">
                                    <li>Item 1</li>
                                    <li>Item 2</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div style={{ flex: '1 1 auto'}}>
                        <div className="listbox-container">
                            <select id="tableSelectTwo">
                                <option value="">Dropdown 2</option>
                            </select>
                            <div id="tableSelectColTwo">
                                <ul className="listbox" id="tableColSelectTwo">
                                    <li>Item 1</li>
                                    <li>Item 2</li>
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
                <button type="button" className="report-designer-button" onClick={drawLines}>Join</button>
                <br/>
                <div className="grid">
                    <h4 style={{ gridRow: '1', gridColumn: '1 / 4', justifySelf: 'center' }}>Join Visualization</h4>
                    <div className="list-container" style={{ gridRow: '2', gridColumn: '1' }}>
                        <ul className="list" id="joinLeft">
                            <li>Item 1</li>
                            <li>Item 2</li>
                        </ul>
                    </div>

                    <div className="lines-container" style={{ gridRow: '2', gridColumn: '2' }}>
                        {lines}
                    </div>

                    <div className="list-container" style={{ gridRow: '2', gridColumn: '3' }}>
                        <ul className="list" id="joinRight">
                            <li>Item 1</li>
                            <li>Item 2</li>
                        </ul>
                    </div>
                </div>
                <br />
                <hr/>
                <div className="grid">
                    <h4 style={{ gridArea: '1 / 1 / 2 / 5'}}>Filters and Conditions</h4>
                    <div className="explanation-box" style={{ gridArea: '2 / 1 / -1 / 2' }}>
                        <p>What kind of data do you want to include or exclude?</p>
                        <a href="/guides/conditionals">Read More</a>
                    </div>

                    <label style={{ gridArea: '2 / 2 / 3 / 3' }}>Select Column</label>
                    <select style={{ gridArea: '3 / 2 / 4 / 3' }} id="columnFilter1">
                        {/* Programmatically Populated */}
                    </select>
                    <button className="report-designer-button" style={{ gridArea: '4 / 2 / 5 / 3' }} onClick="">Add</button>
                    <label style={{ gridArea: '2 / 3 / 3 / 4' }}>Condition</label>
                    <select style={{ gridArea: '3 / 3 / 4 / 4' }} id="condition1">
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
                    <label style={{ gridArea: '2 / 4 / 3 / 5' }}>Value</label>
                    <input type="text" style={{ gridArea: '3 / 4 / 4 / 5' }} className="input-style-short" id="filterValue1"></input>
                    
                    {/* Spacer */}
                    <div style={{ gridArea: '5 / 1 / 6 / 5', height: '40px' }}></div>

                    <h4 style={{ gridArea: '6 / 1 / 7 / 5' }}>Order By</h4>
                    <div className="explanation-box eb-mini" style={{ gridArea: '7 / 1 / 8 / 2' }}>
                        <p>Display what kind of data first?</p>
                    </div>
                    <select style={{ gridArea: '7 / 2 / 8 / 3' }} id="orderbyColumn1">
                        {/* Programmatically Populated */}
                    </select>
                    <select style={{ gridArea: '7 / 3 / 8 / 4' }} id="orderbyAscDesc1">
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                    <button className="report-designer-button" style={{ gridArea: '8 / 2 / 9 / 3' }} onClick="">Add</button>
                    <button className="report-designer-button" style={{ gridArea: '8 / 3 / 9 / 4' }} onClick="">Remove</button>
                </div>
                <br/><br/><hr/>
                <button className="btn-three btn-restrict" onClick="">PREVIEW REPORT</button>
            </section>
            <br/>
        </div>
    );
};

export default HOC(ReportDesigner);
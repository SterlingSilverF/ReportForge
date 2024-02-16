import React, { useState, useEffect } from 'react';
import HOC from '../components/HOC';
import DBConnectionModel from '../models/databaseconnectionmodel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';

const ReportDesigner = () => {
    const [lines, setLines] = useState(null);

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

    class ReportDesignerState {
        constructor() {
            this.reportConfig = null; // This can be an instance of ReportConfigurationModel, CustomSQLReport, or NormalReportConfiguration
            this.availableDBConnections = []; // Array of DBConnectionModel instances
            this.selectedTables = []; // Array of selected table names or instances
            this.selectedColumns = []; // Array of selected column names or instances
            this.joins = []; // Array of join configurations
            this.uiState = {
                isFetchingData: false,
                fetchError: null,
                currentView: 'tableSelection', // Example UI state, managing which part of the form is currently displayed
            };
        }

        // Methods to update the state, handle user actions, etc.
        selectReportConfig(reportConfig) {
            this.reportConfig = reportConfig;
        }

        addDBConnection(dbConnection) {
            this.availableDBConnections.push(dbConnection);
        }

        selectTable(tableName) {
            if (!this.selectedTables.includes(tableName)) {
                this.selectedTables.push(tableName);
            }
            // Additional logic to fetch and display columns for the selected table
        }

        selectColumn(columnName) {
            if (!this.selectedColumns.includes(columnName)) {
                this.selectedColumns.push(columnName);
            }
            // Additional logic as needed
        }

        // Add more methods as needed to handle UI interactions
    }


    // TODO: Fetch table list on page load and populate tables state
    // TODO: Fetch columns for a table when it is checked and populate columns state
    // TODO: Implement logic to update joinTables and joinColumns
    // TODO: Implement join logic and update visualization

    useEffect(() => {
        // Fetch tables on page load
        // Example: setTables({ 'Table A': [], 'Table B': [], 'Table C': [] });
        // For each table, fetch its columns and update the `tables` state
    }, []);

    const handleTableCheck = (tableName) => {
        // When a table is checked, fetch its columns and update the columns state
        // Example: setColumns({ ...columns, [tableName]: fetchedColumns });
    };

    const handleColumnCheck = (tableName, columnName) => {
        // Handle checking and unchecking columns
        // Update the columns state accordingly
    };

    const handleJoinSelection = (side, tableName) => {
        // Handle selection of tables for the join
        // Update joinTables state accordingly
    };

    const handleJoinColumnCheck = (side, columnName) => {
        // Handle checking of columns for the join
        // Update joinColumns state and enable join button accordingly
    };

    const executeJoin = () => {
        // Perform join operation and update visualization
    };

    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Report Designer</h1>
                <hr />
            </div>
            <section className="report-form-box">
                <div className="form-element">
                    <h5>Weclome to the report designer!</h5>
                    <p>Here you'll set up what data you want to see in your report and how.</p>
                    <p>To start, you must select tables that you think may contain relevant data. Once a table is selected, their columns will appear on the right.</p>
                    <a href="/guides/designer" className="input-style-default">How to Use the Designer</a><br/>
                    <a href="/guides/designer" className="input-style-default">Understanding Databases</a>
                </div>
                <br />
                <h2>Select Tables</h2>
                <div className="form-element" style={{ display: 'flex', flexDirection: 'column', marginTop: '10px'}}>
                    <div>
                        <div style={{ flex: 1 }}>
                            <div className="dual-listbox">
                                <div className="listbox-container small-width">
                                    <label htmlFor="tables">Available Tables</label>
                                    <ul className="listbox" id="tables">
                                        <li>Item 1</li>
                                        <li>Item 2</li>
                                    </ul>
                                </div>
                                <div className="icon-container" style={{ display: 'flex', alignItems: 'center' }}>
                                    <FontAwesomeIcon icon={faArrowRightLong} size="3x" />
                                </div>
                                <div className="listbox-container large-width">
                                    <label htmlFor="tablecolumns">Available Columns</label>
                                    <ul className="listbox" id="tablecolumns">
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid">
                    <h2 style={{ gridRow: '1', gridColumn: '1 / 5' }}>Select Shared Columns</h2>
                    <select id="tableSelectOne" style={{ gridRow: '2', gridColumn: '1' }}>
                        <option value="">Dropdown 1</option>
                    </select>
                    <div className="listbox-medium" style={{ gridRow: '3', gridColumn: '1' }}>
                        <ul className="listbox" id="tableColSelectOne">
                            <li>Item 1</li>
                            <li>Item 2</li>
                        </ul>
                    </div>
                    <button type="button" className="report-designer-button" onClick={drawLines}>Join</button>
                    <select style={{ gridRow: '2', gridColumn: '2' }}>
                        <option value="">Dropdown 2</option>
                    </select>
                    <div className="listbox-medium" id="tableSelectTwo" style={{ gridRow: '3', gridColumn: '2' }}>
                        <ul className="listbox" id="tableColSelectTwo">
                            <li>Item 1</li>
                            <li>Item 2</li>
                        </ul>
                    </div>
                    <div className="explanation-box" style={{ gridRow: '2 / 4', gridColumn: '3' }}>
                        <p>In order to display data from different tables properly, each table must be joined to the query.</p>
                        <p>Joining is accomplished by indicating shared, but unique valued columns in two individual tables.</p>
                        <p>Usually these are columns that have the same name and are the unique record number or identifier for ONE of the two tables.</p>
                        <a>Click Here to Read More</a>
                    </div>
                </div>
                <div className="grid visualization-box">
                    <h4 style={{ gridRow: '1', gridColumn: '1 / 4', justifySelf: 'start' }}>Join Visualization</h4>
                    <div className="list-container" style={{ gridRow: '2', gridColumn: '1' }}>
                        <ul className="list" id="list1">
                            {/* Map through your data to create list items */}
                            <li>Item 1</li>
                            <li>Item 2</li>
                        </ul>
                    </div>

                    <div className="lines-container" style={{ gridRow: '2', gridColumn: '2' }}>
                        {lines}
                    </div>

                    <div className="list-container" style={{ gridRow: '2', gridColumn: '3' }}>
                        <ul className="list" id="list2">
                            {/* This list will be identical to the first one */}
                            <li>Item 1</li>
                            <li>Item 2</li>
                        </ul>
                    </div>
                </div>
                <div className="grid">
                    <h4>Filters and Conditions</h4>
                    <div className="explanation-box"></div>
                    <label>Select Column</label>
                    <select>
                        {/* Programmatically Populated */}
                    </select>
                    <label>Condition</label>
                    <select>
                        <option value="=">Equals</option>
                        <option value="!=">Not Equal To</option>
                        <option value=">">Greater Than</option>
                        <option value=">=">Greater Than or Equal To</option>
                        <option value="<">Less Than</option>
                        <option value="<=">Less Than or Equal To</option>
                        <option value="Between">Between</option>
                        <option value="In">Contained in List</option>
                    </select>
                    <label>Value</label>
                    <input type="text"></input>
                    <button className="report-designer-button">Add</button>
                    <button className="report-designer-button">Remove</button>
                </div>
                <div className="form-element" style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
                    <h4>Order By</h4>
                    <p>Display what kind of data first?</p>
                    <div>
                        <select>
                            {/* Programmatically Populated */}
                        </select>
                        <select>
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                        <button className="report-designer-button">Add</button>
                        <button className="report-designer-button">Remove</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HOC(ReportDesigner);
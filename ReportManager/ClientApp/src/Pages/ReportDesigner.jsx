import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import HOC from '../components/HOC';
import { useReportForm } from '../contexts/ReportFormContext';
import DynamicInputs from '../components/dynamicinputs';
import LoadingComponent from '../components/loading';

const ReportDesigner = ({ makeApiRequest, navigate }) => {
    const { reportFormContext, updateReportFormData } = useReportForm();

    const [status, setStatus] = useState('loading'); // loading, ready, error
    const [message, setMessage] = useState('');
    const [isSubmitTriggered, setIsSubmitTriggered] = useState(false);
    const [tables, setTables] = useState([]);
    const [orderedTables, setOrderedTables] = useState([]);
    const [tableColumns, setTableColumns] = useState({});
    const [inputValues, setInputValues] = useState({ [`filter-value-0`]: "" });

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

                    // Existing data or edit
                    if (reportFormContext.selectedColumns) {
                        for (const table of reportFormContext.selectedTables) {
                            const columns = await fetchTableColumns(table, true);
                            setTableColumns(prevState => ({ ...prevState, [table]: columns }));
                        }
                        if (reportFormContext.joinConfig.length > 0) {
                            const extractedJoins = await extractJoinsFromContext();
                            setJoinsInfo(extractedJoins);
                            const orderedTables = reorderTables(reportFormContext.selectedTables, extractedJoins);
                            setOrderedTables(orderedTables);
                        }
                    }
                } catch (error) {
                    console.error("Error loading designer page data:", error);
                    setStatus('error');
                }
            }
        };
        loadDesignerPageData();
    }, [reportFormContext.selectedConnection, reportFormContext.reportType, reportFormContext.dbType, reportFormContext.selectedColumns, reportFormContext.selectedTables]);

    // Convert from condensed join into full join info
    const extractJoinsFromContext = async () => {
        const extractedJoins = [];
        for (const join of reportFormContext.joinConfig) {
            const typeOne = await getColumnDataType(join.columnOne, join.tableOne);
            const typeTwo = await getColumnDataType(join.columnTwo, join.tableTwo);
            const isValidJoin = checkDataTypeCompatibility(typeOne, typeTwo, reportFormContext.dbType);

            extractedJoins.push({
                tableOne: {
                    name: join.tableOne,
                    column: join.columnOne,
                    dataType: typeOne
                },
                tableTwo: {
                    name: join.tableTwo,
                    column: join.columnTwo,
                    dataType: typeTwo
                },
                isValid: isValidJoin,
            });
        }
        return extractedJoins;
    };

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
        updateReportFormData({ selectedTables: newSelectedTables });
        const updatedJoinsInfo = joinsInfo.filter(join =>
            join.tableOne.name !== tableName && join.tableTwo.name !== tableName
        );
        setJoinsInfo(updatedJoinsInfo);

        const orderedTables = reorderTables(newSelectedTables, updatedJoinsInfo);
        setOrderedTables(orderedTables);
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

        const joinExists = joinsInfo.some(join =>
            (join.tableOne.name === tableName || join.tableOne.name === selectedTableTwo) &&
            (join.tableTwo.name === tableName || join.tableTwo.name === selectedTableTwo)
        );
        updateJoinButtonText(joinExists ? "Unjoin" : "Join");

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

        const joinExists = joinsInfo.some(join =>
            (join.tableOne.name === selectedTableOne || join.tableOne.name === tableName) &&
            (join.tableTwo.name === selectedTableOne || join.tableTwo.name === tableName)
        );

        updateJoinButtonText(joinExists ? "Unjoin" : "Join");

        if (tableName) {
            const columns = await fetchTableColumns(tableName);
            setColumnsTableTwo(columns);
        } else {
            setColumnsTableTwo([]);
        }
    };

    function getColumnDataType(columnName, tableName) {
        const column = tableColumns[tableName]?.find(col => col.columnName === columnName);
        return column ? column.dataType : null;
    }

    function checkDataTypeCompatibility(type1, type2, dbType) {
        const complexTypes = ['BLOB', 'IMAGE', 'BYTEA', 'BINARY', 'VARBINARY', 'LONG VARBINARY'];

        if (complexTypes.includes(type1) || complexTypes.includes(type2)) {
            return false;
        }
        // Same types always compatible
        if (type1 === type2) return true;

        const booleanTypes = ['BIT', 'BOOLEAN'];
        const numericTypes = ['INT', 'BIGINT', 'SMALLINT', 'FLOAT', 'DECIMAL', 'NUMERIC'];
        const stringTypes = ['VARCHAR', 'CHAR', 'TEXT', 'NVARCHAR', 'NCHAR'];
        const isType1Boolean = booleanTypes.includes(type1);
        const isType2Boolean = booleanTypes.includes(type2);
        const isType1Numeric = numericTypes.includes(type1);
        const isType2Numeric = numericTypes.includes(type2);
        const isType1String = stringTypes.includes(type1);
        const isType2String = stringTypes.includes(type2);

        // Bool and numeric
        if ((isType1Boolean && isType2Numeric) || (isType1Numeric && isType2Boolean)) {
            /*if ((typeof value1 === 'boolean' && !Number.isInteger(value2)) ||
                (typeof value2 === 'boolean' && !Number.isInteger(value1))) {
                return false;
            }*/
            return true;
        }

        // Numeric and string
        if ((isType1Numeric && isType2String) || (isType1String && isType2Numeric)) {
            return true;
        }

        const dateTimeCompatibilities = {
            'MSSQL': ['DATETIME', 'DATETIME2', 'SMALLDATETIME'],
            'Oracle': ['DATE', 'TIMESTAMP'],
            'MySQL': ['DATETIME', 'TIMESTAMP'],
            'Postgres': ['TIMESTAMP', 'TIMESTAMP WITH TIME ZONE'],
            'DB2': ['TIMESTAMP']
        };

        if (dateTimeCompatibilities[dbType]) {
            let bothDateTime = dateTimeCompatibilities[dbType].includes(type1) && dateTimeCompatibilities[dbType].includes(type2);
            if (bothDateTime) {
                return true;
            }
        }
        return false;
    }

    function updateJoinButtonText(text) {
        const joinButton = document.getElementById("joinButton");
        joinButton.textContent = text;
    };

    async function handleJoinClick() {
        const typeOne = getColumnDataType(selectedJoinColumnOne, selectedTableOne);
        const typeTwo = getColumnDataType(selectedJoinColumnTwo, selectedTableTwo);

        const joinIndex = joinsInfo.findIndex(join =>
            (join.tableOne.name === selectedTableOne || join.tableOne.name === selectedTableTwo) &&
            (join.tableTwo.name === selectedTableOne || join.tableTwo.name === selectedTableTwo)
        );

        if (joinIndex !== -1) {
            updateJoinButtonText("Join");
            setJoinsInfo(prevJoins => prevJoins.filter((_, index) => index !== joinIndex));
        } else {
            if (!selectedJoinColumnOne || !selectedJoinColumnTwo) {
                return;
            }
            const isValidJoin = checkDataTypeCompatibility(typeOne, typeTwo, reportFormContext.dbType);
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

            if (isValidJoin) {
                setSelectedTableOne(selectedTableTwo);
                const columnsOne = await fetchTableColumns(selectedTableTwo);
                setColumnsTableOne(columnsOne);
                setSelectedTableTwo('');
                setColumnsTableTwo([]);
            } else {
                updateJoinButtonText("Unjoin");
            }

            setJoinsInfo(prevJoins => [...prevJoins, joinSelection]);
            setSelectedJoinColumnOne('');
            setSelectedJoinColumnTwo('');

            const orderedTables = reorderTables(reportFormContext.selectedTables, [...joinsInfo, joinSelection]);
            setOrderedTables(orderedTables);
        }
    }

    function reorderTables(selectedTables, joinsInfo) {
        const orderedTables = [];
        
        joinsInfo.forEach(join => {
            if (!orderedTables.includes(join.tableOne.name)) {
                orderedTables.push(join.tableOne.name);
            }
            if (!orderedTables.includes(join.tableTwo.name)) {
                orderedTables.push(join.tableTwo.name);
            }
        });

        selectedTables.forEach(tableName => {
            if (!orderedTables.includes(tableName)) {
                orderedTables.push(tableName);
            }
        });

        return orderedTables;
    }

    const updateReportFormContextWithJoins = () => {
        const joinConfig = joinsInfo.map(join => ({
            tableOne: join.tableOne.name,
            tableTwo: join.tableTwo.name,
            columnOne: join.tableOne.column,
            columnTwo: join.tableTwo.column,
            isValid: join.isValid
        }));

        updateReportFormData({ joinConfig: joinConfig });
        setIsSubmitTriggered(true);
    };

    useEffect(() => {
        const validateAndSubmit = async () => {
            const validationResponse = verifyReportConfiguration();
            setIsSubmitTriggered(false);
            if (validationResponse !== true) {
                setMessage(validationResponse);
            } else {
                await triggerSubmit();
            }
        };

        if (isSubmitTriggered) {
            validateAndSubmit();
        }
    }, [reportFormContext.joinConfig, isSubmitTriggered]);

    // Verification function
    const verifyReportConfiguration = () => {
        const essentialFields = ['reportName', 'dbType', 'selectedConnection'];
        for (let field of essentialFields) {
            if (!reportFormContext[field]) {
                return `The essential field '${field}' is missing.`;
            }
        }

        if (reportFormContext.selectedTables.length === 0) {
            return "At least one table must be selected.";
        }

        if (reportFormContext.selectedColumns.length === 0) {
            return "At least one column must be selected.";
        }

        if (reportFormContext.selectedTables.length > 1 && reportFormContext.joinConfig.length === 0) {
            return "Join configuration is required for multiple selected tables.";
        }

        // Assuming joinsInfo is accessible and contains validity information for joins
        for (let join of reportFormContext.joinConfig) {
            if (!join.isValid) {
                return `The join configuration for '${join.tables.join(" and ")}' is invalid.`;
            }
        }

        return true;
    };

    // Final function
    const triggerSubmit = async () => {
        // triggered by updateReportFormContextWithJoins(); finishing
        const filterValues = Object.values(inputValues);
        const dynamicFilters = reportFormContext.filters
            .map((filter, index) => ({
                ...filter,
                value: filterValues[index] || ''
            }))
            .filter(filter =>
                !Object.keys(filter)
                    .filter(key => key !== 'value' && key !== 'andOr')
                    .some(key => filter[key] === '' || filter[key] === null || filter[key] === undefined)
            );

        const validOrderBys = reportFormContext.orderBys
            .filter(orderBy => !Object.values(orderBy).some(value => value === '' || value === null || value === undefined));

        const validationResponse = verifyReportConfiguration();
        if (validationResponse !== true) {
            setMessage(validationResponse);
            return;
        }

        try {
            const requestBody = {
                SelectedConnection: reportFormContext.selectedConnection,
                DbType: reportFormContext.dbType,
                SelectedTables: reportFormContext.selectedTables,
                SelectedColumns: reportFormContext.selectedColumns,
                JoinConfig: reportFormContext.joinConfig,
                Filters: dynamicFilters.map(({ columnOptions, ...rest }) => rest),
                OrderBys: validOrderBys.map(({ columnOptions, ...rest }) => rest)
            };
            //const formattedString = JSON.stringify(requestBody, null, 2);
            //console.log(formattedString);

            makeApiRequest('post', '/api/report/buildAndVerifySql', requestBody)
                .then((response) => {
                    const compiledSQL = response.data;
                    updateReportFormData({ compiledSQL });
                    setMessage("Success!");
                    navigate('/previewreport');
                })
                .catch((error) => {
                    setMessage("Failed to build and verify SQL.");
                });

            
        } catch (error) {
            console.error("Error submitting report configuration:", error);
            setMessage("There was an error building verification SQL.");
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
                {status === 'loading' && <LoadingComponent />}
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
                        <p>To correlate two separate sets of information in a single report via a database, each set (table) must be "joined" to the query.</p>
                        <p>Joining involves linking tables through a common column. Most often it is the same column name and the unique identifier for ONE of the tables involved.</p>
                        <p>Each table needs to be joined only once, like a chain.</p>
                        <a href="/guides/table-joins">Learn More</a>
                    </div>
                </div>
                <button type="button" id="joinButton" className="report-designer-button" onClick={handleJoinClick}>Join</button>
                <br />
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '.5fr 1fr 1fr 1fr', gridGap: '10px', alignItems: 'start' }}>
                    <div style={{ gridColumn: '1 / 2' }}>
                        <h5>Table Join Checklist</h5>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {orderedTables.map((tableName, index) => {
                                const isAlreadyJoined = joinsInfo.some(join =>
                                    join.tableOne.name === tableName || join.tableTwo.name === tableName
                                );
                                const isJoined = isAlreadyJoined && joinsInfo.find(join =>
                                    join.tableOne.name === tableName || join.tableTwo.name === tableName
                                ).isValid;
                                return (
                                    <li key={index}>
                                        {isJoined ? '✅' : '❌'} {tableName}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div style={{ gridColumn: '2 / 3' }}>
                        <h5>Joined Columns</h5>
                        {joinsInfo.map((join, index) => (
                            <div key={index}>
                                <b>{join.tableOne.name} -&gt; {join.tableTwo.name}</b>
                                <ul>
                                    <li>{join.tableOne.column} = {join.tableTwo.column}</li>
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div style={{ gridColumn: '3 / 4' }}>
                        <h5>Join Valid</h5>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {joinsInfo.map((join, index) => (
                                <li key={index}>
                                    {join.isValid ? '✅' : '❌'} {join.tableOne.name} & {join.tableTwo.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <p>To proceed, only green check marks can be displayed.</p>
                <hr />
                <DynamicInputs fetchTableColumns={fetchTableColumns} inputValues={inputValues} setInputValues={setInputValues} />
                <br /><br /><hr />
                <p>{message}</p>
                <button className="btn-three btn-restrict" onClick={updateReportFormContextWithJoins}>PREVIEW REPORT</button>
            </section>
            <br />
            </div>
    );
};

export default HOC(ReportDesigner);
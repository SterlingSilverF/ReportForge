import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HOC from '../components/HOC';
import { decryptData } from '../components/Cryptonator';
import MessageDisplay from '../components/MessageDisplay';
// TODO: ConnectionForm tooltips

const ConnectionForm = ({ makeApiRequest, username, userID, isEditMode }) => {
    const location = useLocation();
    const encryptedData = location.state?.data;
    const connectionDetails = encryptedData ? decryptData(encryptedData) : null;
    const [title, setTitle] = useState(isEditMode ? 'Edit Connection' : 'Create New Connection'); // TODO: Add connection type to title

    // Form Vars
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [testResult, setTestResult] = useState('');
    const [userGroups, setUserGroups] = useState([]);
    const [oldOwnerType, setOldOwnerType] = useState('');
    const [deleteIden, setDeleteIden] = useState('');

    // Field controller
    const [useExistingServer, setUseExistingServer] = useState(false);
    const defaultFields = useState(['ServerName', 'Port', 'AuthenticationType', 'SaveConnectionUnder']);
    const [selectedDBProvider, setSelectedDBProvider] = useState('MSSQL');
    const [showDbOptions, setShowDbOptions] = useState(true);
    const [serverConnections, setServerConnections] = useState([]);
    const [selectedServerConnection, setSelectedServerConnection] = useState('');
    const [formFields, setFormFields] = useState({
        MSSQL: defaultFields.push('Instance'),
        Oracle: defaultFields.push('Instance'),
        MySQL: defaultFields,
        PostgreSQL: defaultFields,
        MongoDB: defaultFields.push('AuthSource', 'ReplicaSet', 'UseTLS'),
        DB2: defaultFields
    });

    const defaultPorts = {
        MSSQL: 1433,
        Oracle: 1521,
        MySQL: 3306,
        PostgreSQL: 5432,
        MongoDB: 27017,
        DB2: 50000,
    };

    const authTypesByDB = {
        MSSQL: ['Credentials', 'Windows'],
        Oracle: ['Credentials'],
        MySQL: ['Credentials'],
        PostgreSQL: ['Credentials'],
        MongoDB: ['Credentials'],
        DB2: ['Credentials'],
    };

    // Models
    const getDefaultFormState = (dbType) => ({
        Id: '',
        ServerName: '',
        Port: defaultPorts[dbType],
        Instance: '',
        DbType: dbType,
        Username: '',
        Password: '',
        AuthType: authTypesByDB[dbType][0],
        OwnerID: userID,
        OwnerType: 'User',
        FriendlyName: '',
        DatabaseName: '',
        ConfigType: 'Server',
        AuthSource: '',
        ReplicaSet: '',
        UseTLS: false,
        Schema: ''
    });

    const [formStateCurrent, setFormStateCurrent] = useState(getDefaultFormState(selectedDBProvider));

    const serverConnection = {
        Id: formStateCurrent.Id,
        ServerName: formStateCurrent.ServerName,
        Port: formStateCurrent.Port,
        Instance: formStateCurrent.Instance,
        DbType: formStateCurrent.DbType,
        Username: formStateCurrent.Username,
        Password: formStateCurrent.Password,
        AuthType: formStateCurrent.AuthType,
        OwnerID: formStateCurrent.OwnerID,
        OwnerType: formStateCurrent.OwnerType,
        AuthSource: formStateCurrent.AuthSource,
        ReplicaSet: formStateCurrent.ReplicaSet,
        UseTLS: formStateCurrent.UseTLS
    };

    const dbConnection = {
        Id: formStateCurrent.Id,
        CollectionCategory: formStateCurrent.OwnerType,
        FriendlyName: formStateCurrent.FriendlyName,
        DatabaseName: formStateCurrent.DatabaseName,
        Schema: formStateCurrent.Schema
    };

    const serverValidationRules = ['ServerName', 'Port', 'DbType', 'AuthType', 'OwnerID', 'OwnerType'];
    const dbValidationRules = [
        'CollectionCategory',
        'FriendlyName',
        'DatabaseName'
    ];

    // Update passed object
    useEffect(() => {
        if (connectionDetails && connectionDetails.id) {
            const endpoint = connectionDetails.type === 'server'
                ? `api/Connection/FetchServerConnection?connectionId=${connectionDetails.id}&ownerId=${connectionDetails.ownerId}&ownerType=${connectionDetails.ownerType}`
                : `api/Connection/FetchDBConnection?connectionId=${connectionDetails.id}&ownerId=${connectionDetails.ownerId}&ownerType=${connectionDetails.ownerType}`;

            makeApiRequest('get', endpoint)
                .then(response => {
                    setFormStateCurrent(response.data);
                })
                .catch(error => {
                    console.error('Error fetching connection data:', error);
                });
        }
    }, [connectionDetails, makeApiRequest]);

    const _handleChange = (e) => {
        const { name, value } = e.target;

        setFormStateCurrent(prevState => {
            let newState = { ...prevState };

            if (name === 'ConfigType') {
                setDeleteIden(value === 'Server' ? 'ServerName' : 'FriendlyName');
                newState[name] = value;
            } else if (name === 'OwnerType') {
                newState.OwnerID = value === 'Group' ? '' : userID;
                newState[name] = value;
            } else if (name === 'DbType') {
                newState.Port = defaultPorts[value];
                newState.AuthType = authTypesByDB[value][0];
                newState[name] = value;
            } else if (name === 'Id') {
                if (value.includes('|')) {
                    const [id, oldOwnerType] = value.split('|');
                    newState.Id = id;
                    setOldOwnerType(oldOwnerType);
                } else {
                    newState.Id = value;
                    setOldOwnerType(undefined);
                }
            } else {
                newState[name] = value;
            }
            return newState;
        });
    };

    // Separation of concerns for toggle
    useEffect(() => {
        if (formStateCurrent.existingServer) {
            setSelectedServerConnection(formStateCurrent.existingServer);
        }
    }, [formStateCurrent.existingServer]);

    // Load user groups
    useEffect(() => {
        if (username != '') {
            setFormStateCurrent(prevFormState => ({
                ...prevFormState,
                OwnerID: userID,
            }));

            const fetchUserGroups = async () => {
                try {
                    const data = await makeApiRequest('get', `/api/group/GetUserGroups?username=${username}`);
                    setUserGroups(data.data);
                } catch (error) {
                    console.error('Could not fetch user groups:', error.response ? error.response.data : error);
                }
            };
            fetchUserGroups();
        }
    }, [makeApiRequest, username, userID]);

    // Verify connection
    const testConnection = async () => {
        try {
            const data = await makeApiRequest('post', '/api/connection/verify', serverConnection);
            setTestResult("Connection succeeded.");
        } catch (error) {
            console.error('Error verifying connection:', error.response ? error.response.data : error);
            setTestResult('Connection failed.');
        }
    };

    useEffect(() => {
        let url = `/api/connection/`;
        if (formStateCurrent.showConnections === 'OnlyUserOrGroup') {
            let filter = `ownerTypeString=${formStateCurrent.OwnerType}&connectionType=server`;
            const ownerId = formStateCurrent.OwnerType === 'User' ? userID : formStateCurrent.OwnerID;
            if (!ownerId) {
                console.error('Owner ID is missing for fetching connections.');
                return;
            }
            filter += `&ownerId=${ownerId}`;
            url += `GetAllConnections?${filter}`;
        } else if (formStateCurrent.showConnections === 'All') {
            url += `GetAllConnectionsForUserAndGroups?userId=${userID}&username=${username}`;
        } else {
            return;
        }

        const fetchConnections = async () => {
            try {
                const response = await makeApiRequest('get', url);
                setServerConnections(response.data);
            } catch (error) {
                console.error('Could not fetch connections:', error.response ? error.response.data : error);
            }
        };

        fetchConnections();
    }, [showDbOptions, formStateCurrent, userID, username, makeApiRequest]);


    const validateConnectionData = (data, rules, useExistingServer = false) => {
        const effectiveRules = useExistingServer ? ['Id'] : [...rules];
        const fieldsToIgnoreForExistingServer = ['ServerName', 'Port', 'DbType', 'AuthType'];

        const missingFields = effectiveRules.filter(rule => {
            if (useExistingServer && fieldsToIgnoreForExistingServer.includes(rule)) {
                return false;
            }
            return !data[rule] || data[rule].toString().trim() === '';
        });

        return {
            isValid: missingFields.length === 0,
            missingFields,
        };
    };

    const handleSave = async () => {
        const isServerConfig = formStateCurrent.ConfigType === 'Server';
        let data = isServerConfig ? serverConnection : dbConnection;
        let endpoint = '';
        let serverId = null;
        const isDuplicatingToNewOwner = formStateCurrent.showConnections === 'All' && formStateCurrent.Id && useExistingServer;

        if (formStateCurrent.OwnerType === 'User') {
            data.OwnerID = userID;
            formStateCurrent.OwnerID = userID;
        }

        if (isDuplicatingToNewOwner) {
            const duplicateData = {
                Id: formStateCurrent.Id,
                OwnerID: formStateCurrent.OwnerID,
                OwnerType: formStateCurrent.OwnerType,
                OldOwnerType: oldOwnerType
            };
            try {
                const duplicateResponse = await makeApiRequest('post', '/api/connection/DuplicateServerConnection', duplicateData);
                dbConnection.Id = duplicateResponse.data;
                if (formStateCurrent.ConfigType === "Database") {
                    endpoint = "/api/connection/AddDBConnection";
                    data = dbConnection;
                    const dbCreationResponse = await makeApiRequest('post', endpoint, data);
                    setMessage("Database connection created successfully.");
                    setIsSuccess(true);
                    return;
                }
                else {
                    setIsSuccess(true);
                    setMessage("Server connection copied successfully.");
                }

            } catch (error) {
                setIsSuccess(false);
                setMessage("Failed to copy server connection.");
                return;
            }
        } else {
            endpoint = isEditMode
                ? (formStateCurrent.ConfigType === 'Server'
                    ? '/api/connection/UpdateServerConnection'
                    : '/api/connection/UpdateDBConnection')
                : (formStateCurrent.ConfigType === 'Server'
                    ? '/api/connection/AddServerConnection'
                    : '/api/connection/AddDBConnection');
        }

        const validationRules = isServerConfig ? serverValidationRules : dbValidationRules;
        const { isValid, missingFields } = validateConnectionData(data, validationRules);

        if (!isValid) {
            setMessage(`Missing required fields: ${missingFields.join(', ')}`);
            setIsSuccess(false);
            return;
        }

        if (formStateCurrent.ConfigType === 'Database' && (!dbConnection.Id || dbConnection.Id.trim() === '')) {
            try {
                const serverResponse = await makeApiRequest('post', '/api/connection/AddServerConnection', serverConnection);
                serverId = serverResponse.data;
                dbConnection.Id = serverId;
                data = dbConnection;
            } catch (error) {
                setIsSuccess(false);
                setMessage("Server connection creation failed.");
                return;
            }
        }

        try {
            const saveResponse = await makeApiRequest('post', endpoint, data);
            if (saveResponse.data && saveResponse.data.id) {
                serverId = saveResponse.data.id;
                setMessage("Server connection already exists under this owner.");
            } else {
                setIsSuccess(true);
                setMessage(formStateCurrent.ConfigType === 'Server' ? 'Server connection saved.' : 'Database connection saved.');
            }
        } catch (error) {
            setIsSuccess(false);
            console.log(data);
            console.log(error);
            setMessage("Saving failed.");
        }
    };

    const deleteConnection = async (connectionId, connectionType) => {
        let deleteEndpoint = '';
        if (connectionType === 'Server') {
            deleteEndpoint = `/api/connection/DeleteServerConnection/${connectionId}`;
        } else if (connectionType === 'Database') {
            deleteEndpoint = `/api/connection/DeleteDBConnection/${connectionId}`;
        }

        try {
            await makeApiRequest('delete', deleteEndpoint);
            return true;
        } catch (error) {
            console.error("Error deleting connection: ", error);
            return false;
        }
    };

    return (
        <div className='sub-container outer'>
            <div className='form-header'>
                <h2>{title}</h2>
            </div>
            <section className='box form-box'>
            <br/>
                {/* Configuration Type Selector */}
                <div className='form-element' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '80%', textAlign: 'left', paddingBottom: '5px' }}>
                        <label>Select Configuration Type</label>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', alignItems: 'center' }}>
                        <select className='input-style-default standard-select' name='ConfigType' onChange={_handleChange}>
                            <option value='Server'>Server Configuration</option>
                            <option value='Database'>DB Configuration</option>
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type='checkbox'
                                name='useExistingServer'
                                checked={useExistingServer}
                                onChange={(e) => setUseExistingServer(e.target.checked)}
                            />
                            <label>Use Existing Server Connection</label>
                        </div>
                    </div>
                </div>


                {/* Existing Server Checkbox and Dropdown */}
                {(useExistingServer) && (
                    <div>
                        {useExistingServer && (
                            <div>
                                <label>Show Connections From:</label><br/>
                                <label style={{ marginRight: '20px' }}>
                                    <input
                                        type='radio'
                                        name='showConnections'
                                        value='OnlyUserOrGroup'
                                        checked={formStateCurrent.showConnections === 'OnlyUserOrGroup'}
                                        onChange={() => setFormStateCurrent({ ...formStateCurrent, showConnections: 'OnlyUserOrGroup' })}
                                    />
                                    'Save Under' Selection (User or Group)
                                </label>
                                <label>
                                    <input
                                        type='radio'
                                        name='showConnections'
                                        value='All'
                                        checked={formStateCurrent.showConnections === 'All'}
                                        onChange={() => setFormStateCurrent({ ...formStateCurrent, showConnections: 'All' })}
                                    />
                                    All
                                </label><br />
                                <select
                                    name='Id'
                                    onChange={_handleChange}
                                    className='input-style-default standard-select'>
                                    <option value="">--Select a Connection--</option>
                                    {serverConnections.map((server, index) =>
                                        <option key={index} value={`${server.id}|${server.ownerType}`}>
                                            {server.serverName} - ({server.dbType}{server.ownerName ? `, ${server.ownerName}` : ''})
                                        </option>
                                    )}
                                </select><br /><br />
                            </div>
                        )}
                    </div>
                )}

                {/* Common Fields */}
                {useExistingServer === false && (
                    <>
                    <div>
                        <label>Database Provider</label><br/>
                        <select
                            name='DbType'
                            onChange={_handleChange}
                            className='input-style-default standard-select'
                            style={{ fontSize: '1em' }}>
                            <option value='MSSQL'>Microsoft SQL Server</option>
                            <option value='Oracle'>Oracle</option>
                            <option value='MySQL'>MySQL</option>
                            <option value='PostgreSQL'>PostgreSQL</option>
                            <option value='MongoDB'>MongoDB</option>
                            <option value='DB2'>DB2</option>
                        </select>
                    </div><br/>
                        <div className='form-element'>
                            <label>Server Name or IP Address: *</label><br />
                            <input name='ServerName' onChange={_handleChange} className='input-style-default' />
                        </div>
                        <div className='form-element' style={{ alignItems: 'center' }}>
                            <label style={{ marginRight: '5px' }}>Port: *</label>
                            <input
                                type='number'
                                name='Port'
                                value={formStateCurrent.Port}
                                onChange={_handleChange}
                                className='input-style-mini'
                            />
                            {(formStateCurrent.DbType === 'MSSQL' || formStateCurrent.DbType === 'Oracle') && (
                                <>
                                    <label style={{ marginLeft: '20px', marginRight: '10px' }}>
                                        {formStateCurrent.DbType === 'Oracle' ? 'SID or Service Name' : 'Instance'}:
                                    </label>
                                    <input
                                        name="Instance"
                                        value={formStateCurrent.Instance}
                                        onChange={_handleChange}
                                        className={formStateCurrent.DbType === 'Oracle' ? 'input-style-short' : 'input-style-mini'} />
                                </>
                            )}
                        </div>
                        <div className='form-element'>
                            <label>Authentication Type</label><br />
                            <select
                                name='AuthType'
                                onChange={_handleChange}
                                className='input-style-default standard-select'>
                                {authTypesByDB[formStateCurrent.DbType].map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        {formStateCurrent.AuthType === 'Credentials' && (
                            <>
                                <div className='form-element'>
                                    <label>Username: *</label><br />
                                    <input name='Username' onChange={_handleChange} className='input-style-default' />
                                </div>
                                <div className='form-element'>
                                    <label>Password: *</label><br />
                                    <input type='Password' name='Password' onChange={_handleChange} className='input-style-default' />
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Database Fields */}
                {formStateCurrent.ConfigType === 'Database' && (
                    <>
                    <br/>
                        <div className='form-element'>
                            <label>Database Name: *</label><br />
                            <input
                                name='DatabaseName'
                                value={formStateCurrent.DatabaseName}
                                onChange={_handleChange}
                                className='input-style-default'
                            />
                        </div>
                        <div className='form-element'>
                            <label>Friendly Name:</label><br />
                            <input
                                name='FriendlyName'
                                value={formStateCurrent.FriendlyName}
                                onChange={_handleChange}
                                className='input-style-default'
                            />
                        </div>
                        <div className='form-element'>
                            <label>Schema:</label><br />
                            <input
                                name='Schema'
                                value={formStateCurrent.Schema}
                                onChange={_handleChange}
                                className='input-style-default'
                            />
                        </div>
                    </>
                )}

                {/* MongoDB Only */}
                {formStateCurrent.DbType === 'MongoDB' && (
                    <>
                        <br />
                        <label>MongoDB Connection Configuration</label>
                        <br />
                        <div className='form-element'>
                            <label>Auth Source</label><br />
                            <input
                                name='AuthSource'
                                value={formStateCurrent.AuthSource}
                                onChange={_handleChange}
                                className='input-style-default' />
                        </div>
                        <div className='form-element'>
                            <label>Replica Set</label><br />
                            <input
                                name='ReplicaSet'
                                value={formStateCurrent.ReplicaSet}
                                onChange={_handleChange}
                                className='input-style-default' />
                        </div>
                        <div className='form-element'>
                            <input
                                type='checkbox'
                                name='UseTLS'
                                checked={formStateCurrent.UseTLS}
                                onChange={(e) => setFormStateCurrent(prevState => ({ ...prevState, UseTLS: e.target.checked }))} />
                            <label>Use SSL</label>
                        </div>
                    </>
                )}

                {/* Save Connection Fields */}
                <div className='form-element' style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1 }}>
                            <label>Save Connection Under</label>
                        </div>
                        {formStateCurrent.OwnerType === 'Group' && (
                            <div style={{ flex: 1 }}>
                                <label>Select Group</label>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1 }}>
                            <select
                                name='OwnerType'
                                onChange={_handleChange}
                                className='input-style-short'>
                                <option value='User'>Current User</option>
                                <option value='Group'>Group</option>
                            </select>
                        </div>
                        {formStateCurrent.OwnerType === 'Group' && (
                            <div style={{ flex: 1 }}>
                                <select
                                    name='OwnerID'
                                    onChange={_handleChange}
                                    className='input-style-default'>
                                    <option value={null}>--Select a group--</option>
                                    {userGroups.map((group, index) =>
                                        <option key={index} value={group.id}>{group.groupName}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <br />
                {!useExistingServer && (
                    <>
                        <button type='button' onClick={testConnection} className='btn-four'>Test Connection</button>
                        <label className='success-message'>{testResult}</label><br /><br />
                    </>
                )}
                    <button type="button" onClick={handleSave} className="btn-three">{isEditMode ? 'Update' : 'Save'}</button>
                    {isEditMode && (
                    <button type="button" onClick={deleteConnection} className="btn-three">
                            Delete
                        </button>
                )}
                {message && <MessageDisplay message={message} isSuccess={isSuccess} className="success-message" />}
            </section>
            <br /><br />
        </div>
    );
};

export default HOC(ConnectionForm);
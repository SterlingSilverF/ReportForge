import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HOC from '../components/HOC';
import MessageDisplay from '../components/MessageDisplay';
import LoadingComponent from '../components/loading';
import { useConnectionForm } from '../contexts/ConnectionFormContext';
// TODO: ConnectionForm tooltips

const ConnectionForm = ({ makeApiRequest, username, userID, navigate }) => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const connectionId = queryParams.get('connectionId');
    const connectionType = queryParams.get('connectionType');
    const ownerId = queryParams.get('ownerId');
    const ownerType = queryParams.get('ownerType');

    const { connectionFormData, updateConnectionFormData, clearConnectionFormData } = useConnectionForm();
    const [isEditMode, setIsEditMode] = useState(!!connectionId);
    const [title, setTitle] = useState(isEditMode ? 'Edit Connection' : 'Create New Connection');

    // Form Vars
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [testResult, setTestResult] = useState('');
    const [oldOwnerType, setOldOwnerType] = useState('');
    const [deleteIdentifier, setDeleteIdentifier] = useState('');

    // Field controller
    const defaultFields = useState(['ServerName', 'Port', 'AuthenticationType', 'SaveConnectionUnder']);
    const [showDbOptions, setShowDbOptions] = useState(true);
    const [serverConnections, setServerConnections] = useState([]);
    const [selectedServerConnection, setSelectedServerConnection] = useState('');
    const [formFields, setFormFields] = useState({
        MSSQL: defaultFields.push('Instance'),
        Oracle: defaultFields.push('Instance'),
        MySQL: defaultFields,
        PostgreSQL: defaultFields,
        // MongoDB: defaultFields.push('AuthSource', 'ReplicaSet', 'UseTLS'),
        DB2: defaultFields
    });

    const defaultPorts = {
        MSSQL: 1433,
        Oracle: 1521,
        MySQL: 3306,
        PostgreSQL: 5432,
        // MongoDB: 27017,
        DB2: 50000,
    };

    const authTypesByDB = {
        MSSQL: ['Credentials', 'Windows'],
        Oracle: ['Credentials'],
        MySQL: ['Credentials'],
        PostgreSQL: ['Credentials'],
        // MongoDB: ['Credentials'],
        DB2: ['Credentials'],
    };

    const serverValidationRules = ['serverName', 'port', 'dbType', 'authType', 'ownerID', 'ownerType'];
    const dbValidationRules = [
        'friendlyName',
        'databaseName'
    ];

    useEffect(() => {
        return () => {
            // Clear the form data when the component unmounts or the location changes
            clearConnectionFormData();
        };
    }, [location, clearConnectionFormData]);

    const fetchUserGroups = async () => {
        try {
            const data = await makeApiRequest('get', `/api/group/GetUserGroups?username=${username}`);
            updateConnectionFormData({
                userGroups: data.data,
            });
        } catch (error) {
            console.error('Could not fetch user groups:', error.response ? error.response.data : error);
        }
    };

    useEffect(() => {
        if (username !== '') {
            updateConnectionFormData({
                ownerID: userID,
            });

            fetchUserGroups();
        }
    }, [makeApiRequest, username, userID, updateConnectionFormData]);

    useEffect(() => {
        if (connectionId) {
            setIsLoading(true);

            const endpoint =
                connectionType === 'Server'
                    ? `api/Connection/FetchServerConnection?connectionId=${connectionId}&ownerId=${ownerId}&ownerType=${ownerType}`
                    : `api/Connection/FetchDBConnection?connectionId=${connectionId}&ownerId=${ownerId}&ownerType=${ownerType}`;

            setIsLoading(true);
            setLoadingMessage('Fetching connection data...');

            makeApiRequest('get', endpoint)
                .then(response => {
                    var data = response.data;

                    if (connectionType === 'Server') {
                        updateConnectionFormData({
                            id: data.id,
                            serverName: data.serverName,
                            port: data.port || defaultPorts[data.dbType],
                            dbType: data.dbType,
                            instance: data.instance,
                            username: data.username,
                            authType: data.authType || authTypesByDB[data.dbType][0],
                            ownerID: data.ownerID,
                            ownerType: data.ownerType,
                            configType: connectionType,
                            selectedServerConnection: data.selectedServerConnection,
                            serverConnections: data.serverConnections || [],
                        });
                    } else {
                        updateConnectionFormData({
                            id: data.id,
                            serverName: data.serverName,
                            port: data.port || defaultPorts[data.dbType],
                            dbType: data.dbType,
                            instance: data.instance,
                            username: data.username,
                            authType: data.authType || authTypesByDB[data.dbType][0],
                            ownerID: data.ownerID,
                            ownerType: data.ownerType,
                            configType: connectionType,
                            selectedServerConnection: data.selectedServerConnection,
                            userGroups: data.userGroups || [],
                            serverConnections: data.serverConnections || [],
                            friendlyName: data.friendlyName,
                            databaseName: data.databaseName,
                            schema: data.schema,
                        });
                    }

                    setIsLoading(false);
                    setLoadingMessage('');
                })
                .catch(error => {
                    console.error('Error fetching connection data:', error);
                    setIsLoading(false);
                    setLoadingMessage('Error fetching data.');
                });
        }
    }, [connectionId, connectionType, ownerType, ownerId, makeApiRequest, updateConnectionFormData, userID]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        let newState = { ...connectionFormData };

        if (name === 'configType') {
            setDeleteIdentifier(value === 'Server' ? 'ServerName' : 'FriendlyName');
            newState[name] = value;
        } else if (name === 'ownerType') {
            newState.ownerID = value === 'Group' ? '' : userID;
            newState[name] = value;
        } else if (name === 'dbType') {
            newState.port = defaultPorts[value];
            newState.authType = authTypesByDB[value][0];
            newState[name] = value;
        } else if (name === 'id') {
            if (value.includes('|')) {
                const [id, oldOwnerType] = value.split('|');
                newState.id = id;
                setOldOwnerType(oldOwnerType);
            } else {
                newState.id = value;
                setOldOwnerType(undefined);
            }
        } else {
            newState[name] = value;
        }

        updateConnectionFormData(newState);
    };

    // Separation of concerns for toggle
    useEffect(() => {
        if (connectionFormData.existingServer) {
            setSelectedServerConnection(connectionFormData.selectedServerConnection);
        }
    }, [connectionFormData.existingServer, connectionFormData.selectedServerConnection]);

    // Verify connection
    const testConnection = async () => {
        try {
            setIsLoading(true);
            setTestResult('');

            const connectionRequestData = {
                id: connectionFormData.id,
                serverName: connectionFormData.serverName,
                port: connectionFormData.port,
                instance: connectionFormData.instance,
                dbType: connectionFormData.dbType,
                username: connectionFormData.username,
                password: connectionFormData.password,
                authType: connectionFormData.authType,
                ownerID: connectionFormData.ownerID,
                ownerType: connectionFormData.ownerType,
                authSource: connectionFormData.authSource,
                replicaSet: connectionFormData.replicaSet,
                useTLS: connectionFormData.useTLS,
            };

            const data = await makeApiRequest('post', '/api/connection/verify', connectionRequestData);
            setTestResult("Connection succeeded.");
            setIsLoading(false);
        } catch (error) {
            console.error('Error verifying connection:', error.response ? error.response.data : error);
            setTestResult('Connection failed.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userID !== "" && username !== "") {
            let url = `/api/connection/`;

            if (connectionFormData.showConnections === 'OnlyUserOrGroup') {
                let filter = `ownerTypeString=${connectionFormData.ownerType}&connectionType=server`;
                const ownerId = connectionFormData.ownerType === 'Personal' ? userID : connectionFormData.ownerID;

                if (!ownerId || ownerId == "--Select a Group--") {
                    updateConnectionFormData({
                        serverConnections: [],
                    });
                    return;
                }

                filter += `&ownerId=${ownerId}`;
                url += `GetAllConnections?${filter}`;
            } else if (connectionFormData.showConnections === 'All') {
                url += `GetAllConnectionsForUserAndGroups?userId=${userID}&username=${username}`;
            } else {
                return;
            }

            const fetchConnections = async () => {
                try {
                    const response = await makeApiRequest('get', url);
                    updateConnectionFormData({
                        serverConnections: response.data,
                    });
                } catch (error) {
                    console.error('Could not fetch connections:', error.response ? error.response.data : error);
                }
            };

            fetchConnections();
        }
    }, [connectionFormData.showConnections, userID, username, makeApiRequest, updateConnectionFormData]);

    const validateConnectionData = (data, rules, useExistingServer = false) => {
        const effectiveRules = useExistingServer ? ['id'] : [...rules];
        const fieldsToIgnoreForExistingServer = ['serverName', 'port', 'dbType', 'authType'];

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
        const isServerConfig = connectionFormData.configType === 'Server';
        let endpoint = '';
        let serverId = null;
        const httpMethod = isEditMode ? 'put' : 'post';
        const isDuplicatingToNewOwner = connectionFormData.id && connectionFormData.existingServer && !isEditMode;

        const connectionRequest = {
            id: connectionFormData.id,
            serverName: connectionFormData.serverName,
            port: connectionFormData.port,
            instance: connectionFormData.instance,
            dbType: connectionFormData.dbType,
            username: connectionFormData.username,
            password: connectionFormData.password,
            authType: connectionFormData.authType,
            ownerID: connectionFormData.ownerID,
            ownerType: connectionFormData.ownerType,
            authSource: connectionFormData.authSource,
            replicaSet: connectionFormData.replicaSet,
            useTLS: connectionFormData.useTLS,
        };

        const dbConnectionRequest = {
            id: connectionFormData.id,
            ownerId: connectionFormData.ownerID,
            collectionCategory: connectionFormData.ownerType,
            friendlyName: connectionFormData.friendlyName,
            schema: connectionFormData.schema,
            databaseName: connectionFormData.databaseName,
        };

        const updateDbConnectionRequest = {
            id: connectionFormData.id,
            serverName: connectionFormData.serverName,
            port: connectionFormData.port,
            instance: connectionFormData.instance,
            dbType: connectionFormData.dbType,
            username: connectionFormData.username,
            password: connectionFormData.password,
            authType: connectionFormData.authType,
            ownerID: connectionFormData.ownerID,
            collectionCategory: connectionFormData.ownerType,
            friendlyName: connectionFormData.friendlyName,
            schema: connectionFormData.schema,
            databaseName: connectionFormData.databaseName,
            authSource: connectionFormData.authSource,
            replicaSet: connectionFormData.replicaSet,
            useTLS: connectionFormData.useTLS,
        };

        if (connectionFormData.ownerType === 'Personal') {
            connectionRequest.ownerID = userID;
            updateConnectionFormData({ ownerID: userID });
        }

        if (isDuplicatingToNewOwner) {
            const duplicateConnectionRequest = {
                id: connectionFormData.id,
                ownerID: connectionFormData.ownerID,
                ownerType: connectionFormData.ownerType,
                oldOwnerType: oldOwnerType,
            };

            console.log('Duplicate Connection Request Payload:', duplicateConnectionRequest);

            try {
                const duplicateResponse = await makeApiRequest('post', '/api/connection/DuplicateServerConnection', duplicateConnectionRequest);
                connectionRequest.id = duplicateResponse.data;
                dbConnectionRequest.id = duplicateResponse.data;

                if (connectionFormData.configType === "Database") {
                    endpoint = "/api/connection/AddDBConnection";
                    console.log('DB Connection Request Payload:', dbConnectionRequest);
                    const dbCreationResponse = await makeApiRequest('post', endpoint, dbConnectionRequest);
                    setMessage("Database connection created successfully.");
                    setIsSuccess(true);
                    return;
                } else {
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
                ? (connectionFormData.configType === 'Server'
                    ? '/api/connection/UpdateServerConnection'
                    : '/api/connection/UpdateDBConnection')
                : (connectionFormData.configType === 'Server'
                    ? '/api/connection/AddServerConnection'
                    : '/api/connection/AddDBConnection');
        }

        let validationRules = isServerConfig ? serverValidationRules : dbValidationRules;
        const requestData = isEditMode
            ? (connectionFormData.configType === 'Server' ? connectionRequest : updateDbConnectionRequest)
            : (connectionFormData.configType === 'Server' ? connectionRequest : dbConnectionRequest);
        const { isValid, missingFields } = validateConnectionData(requestData, validationRules, connectionFormData.existingServer);

        if (!isValid) {
            setMessage(`Missing required fields: ${missingFields.join(', ')}`);
            setIsSuccess(false);
            return;
        }

        if (connectionFormData.configType === 'Database' && (!connectionRequest.id || connectionRequest.id.trim() === '')) {
            try {
                console.log('Server Connection Request Payload (Creating new server for DB connection):', connectionRequest);
                const serverResponse = await makeApiRequest('post', '/api/connection/AddServerConnection', connectionRequest);
                serverId = serverResponse.data;
                dbConnectionRequest.id = serverId;
            } catch (error) {
                setIsSuccess(false);
                setMessage("Server connection creation failed.");
                return;
            }
        }

        console.log('Save Connection Request Payload:', requestData);

        try {
            const saveResponse = await makeApiRequest(httpMethod, endpoint, requestData);
            if (saveResponse.data && saveResponse.data.id) {
                serverId = saveResponse.data.id;
                setMessage("Server connection already exists under this owner.");
            } else {
                setIsSuccess(true);
                setMessage(connectionFormData.configType === 'Server' ? 'Server connection saved.' : 'Database connection saved.');
            }
        } catch (error) {
            setIsSuccess(false);
            console.log(requestData);
            console.log(error);

            const errorMessage = error.message ? `Saving failed: ${error.message}` : "Saving failed with an unknown error.";
            setMessage(errorMessage);
        }
    };

    const deleteConnection = async (connectionId, ownerType) => {
        const userConfirmed = window.confirm('Are you sure you want to delete this connection? This may affect reports using this connection if not updated.');
        if (userConfirmed) {
            makeApiRequest('delete', `/api/connection/DeleteConnection?connectionId=${connectionId}&ownerType=${ownerType}`)
                .then(() => {
                    alert('Connection deleted successfully.');
                    setTimeout(() => {
                        navigate('/');
                    }, 2000);
                })
                .catch((error) => {
                    alert('Error deleting connection. Please try again later.');
                    console.error('Error deleting connection:', error);
                });
        } else {
            console.log('Deletion cancelled.');
        }
    };


    return (
        <div className='sub-container outer'>
            <div className='form-header'>
                <h2>{title}</h2>
            </div>
            <section className='box form-box'>
                <br />
                {/* Configuration Type Selector */}
                <div className='form-element' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '80%', textAlign: 'left', paddingBottom: '5px' }}>
                        <label>Select Configuration Type</label>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', alignItems: 'center' }}>
                        <select
                            className='input-style-default standard-select'
                            name='configType'
                            value={connectionFormData.configType}
                            onChange={handleChange}>
                            <option value='Server'>Server Configuration</option>
                            <option value='Database'>DB Configuration</option>
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type='checkbox'
                                name='useExistingServer'
                                checked={connectionFormData.existingServer}
                                onChange={(e) => updateConnectionFormData({ existingServer: e.target.checked })}
                            />
                            <label>Use Existing Server Connection</label>
                        </div>
                    </div>
                </div>

                {/* Existing Server Checkbox and Dropdown */}
                {connectionFormData.existingServer && (
                    <div>
                        <div>
                            <label>Show Connections From:</label><br />
                            <label style={{ marginRight: '20px' }}>
                                <input
                                    type='radio'
                                    name='showConnections'
                                    value='OnlyUserOrGroup'
                                    checked={connectionFormData.showConnections === 'OnlyUserOrGroup'}
                                    onChange={() => updateConnectionFormData({ showConnections: 'OnlyUserOrGroup' })}
                                />
                                'Save Under' Selection (User or Group)
                            </label>
                            <label>
                                <input
                                    type='radio'
                                    name='showConnections'
                                    value='All'
                                    checked={connectionFormData.showConnections === 'All'}
                                    onChange={() => updateConnectionFormData({ showConnections: 'All' })}
                                />
                                All
                            </label><br />
                            <select
                                name='id'
                                onChange={handleChange}
                                className='input-style-default standard-select'>
                                <option value="">--Select a Connection--</option>
                                {connectionFormData.serverConnections.map((server, index) =>
                                    <option key={index} value={`${server.id}|${server.ownerType}`}>
                                        {server.serverName} - ({server.dbType}{server.ownerName ? `, ${server.ownerName}` : ''})
                                    </option>
                                )}
                            </select><br /><br />
                        </div>
                    </div>
                )}

                {/* Common Fields */}
                {!connectionFormData.existingServer && (
                    <>
                        <div>
                            <label>Database Provider</label><br />
                            <select
                                name='dbType'
                                onChange={handleChange}
                                className='input-style-default standard-select'
                                style={{ fontSize: '1em' }}>
                                <option value='MSSQL'>Microsoft SQL Server</option>
                                <option value='Oracle'>Oracle</option>
                                <option value='MySQL'>MySQL</option>
                                <option value='PostgreSQL'>PostgreSQL</option>
                                <option value='DB2'>DB2</option>
                            </select>
                        </div><br />
                        <div className='form-element'>
                            <label>Server Name or IP Address: *</label><br />
                            <input
                                name='serverName'
                                value={connectionFormData.serverName}
                                onChange={(e) => updateConnectionFormData({ serverName: e.target.value })}
                                className='input-style-default'
                            />
                        </div>
                        <div className='form-element' style={{ alignItems: 'center' }}>
                            <label style={{ marginRight: '5px' }}>Port: *</label>
                            <input
                                type='number'
                                name='port'
                                value={connectionFormData.port}
                                onChange={(e) => updateConnectionFormData({ port: e.target.value })}
                                className='input-style-mini'
                            />
                            {(connectionFormData.dbType === 'MSSQL' || connectionFormData.dbType === 'Oracle') && (
                                <>
                                    <label style={{ marginLeft: '20px', marginRight: '10px' }}>
                                        {connectionFormData.dbType === 'Oracle' ? 'SID or Service Name' : 'Instance'}:
                                    </label>
                                    <input
                                        name="instance"
                                        value={connectionFormData.instance}
                                        onChange={(e) => updateConnectionFormData({ instance: e.target.value })}
                                        className={connectionFormData.dbType === 'Oracle' ? 'input-style-short' : 'input-style-mini'}
                                    />
                                </>
                            )}
                        </div>
                        <div className='form-element'>
                            <label>Authentication Type</label><br />
                            <select
                                name='authType'
                                value={connectionFormData.authType}
                                onChange={handleChange}
                                className='input-style-default standard-select'>
                                {authTypesByDB[connectionFormData.dbType].map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        {connectionFormData.authType === 'Credentials' && (
                            <>
                                <div className='form-element'>
                                    <label>Username: *</label><br />
                                    <input
                                        name='username'
                                        value={connectionFormData.username}
                                        onChange={(e) => updateConnectionFormData({ username: e.target.value })}
                                        className='input-style-default'
                                    />
                                </div>
                                <div className='form-element'>
                                    <label>Password: *</label><br />
                                    <input
                                        type='password'
                                        name='password'
                                        value={connectionFormData.password}
                                        onChange={(e) => updateConnectionFormData({ password: e.target.value })}
                                        onCopy={(e) => e.preventDefault()}
                                        className='input-style-default'
                                    />
                                </div>
                            </>
                        )}
                    </>
                )}

                {connectionFormData.configType === 'Database' && (
                    <>
                        <br />
                        <div className='form-element'>
                            <label>Database Name: *</label><br />
                            <input
                                name='databaseName'
                                value={connectionFormData.databaseName}
                                onChange={(e) => updateConnectionFormData({ databaseName: e.target.value })}
                                className='input-style-default'
                            />
                        </div>
                        <div className='form-element'>
                            <label>Friendly Name*:</label><br />
                            <input
                                name='friendlyName'
                                value={connectionFormData.friendlyName}
                                onChange={(e) => updateConnectionFormData({ friendlyName: e.target.value })}
                                className='input-style-default'
                            />
                        </div>
                        <div className='form-element'>
                            <label>Schema:</label><br />
                            <input
                                name='schema'
                                value={connectionFormData.schema}
                                onChange={(e) => updateConnectionFormData({ schema: e.target.value })}
                                className='input-style-default'
                            />
                        </div>
                    </>
                )}

                {/* Save Connection Fields */}
                <div className='form-element' style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1 }}>
                            <label>Save Connection Under</label>
                        </div>
                        {connectionFormData.ownerType === 'Group' && (
                            <div style={{ flex: 1 }}>
                                <label>Select Group</label>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1 }}>
                            <select
                                name='ownerType'
                                value={connectionFormData.ownerType}
                                onChange={handleChange}
                                className='input-style-short'>
                                <option value='Personal'>Current User</option>
                                <option value='Group'>Group</option>
                            </select>
                        </div>
                        {connectionFormData.ownerType === 'Group' && (
                            <div style={{ flex: 1 }}>
                                <select
                                    name='ownerID'
                                    value={connectionFormData.ownerID}
                                    onChange={handleChange}
                                    className='input-style-default'>
                                    <option value="">--Select a Group--</option>
                                    {connectionFormData.userGroups.map((group, index) => (
                                        <option
                                            key={index}
                                            value={group.id}
                                            selected={group.id === connectionFormData.ownerID}>
                                            {group.groupName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <br />
                {!connectionFormData.existingServer && (
                    <>
                        <button type='button' onClick={testConnection} className='btn-four'>Test Connection</button>
                        <label className='success-message'>{testResult}</label>
                        <LoadingComponent isLoading={isLoading} message={loadingMessage} />
                        <br /><br />
                    </>
                )}
                <button type="button" onClick={handleSave} className="btn-three">{isEditMode ? 'Update' : 'Save'}</button>
                <br />
                {isEditMode && (
                    <button type="button" onClick={() => deleteConnection(connectionFormData.id, ownerType)} className="btn-three">
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
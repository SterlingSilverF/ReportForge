import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HOC from '../components/HOC';
import { decryptData } from '../components/Cryptonator';
import MessageDisplay from '../components/MessageDisplay';

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
        MongoDB: defaultFields,
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
    const [formStateCurrent, setFormStateCurrent] = useState({
        Id: '',
        ServerName: '',
        Port: 1433,
        Instance: '',
        DbType: 'MSSQL',
        Username: '',
        Password: '',
        AuthType: 'Credentials',
        OwnerID: userID,
        OwnerType: 'User',
        FriendlyName: '',
        DatabaseName: '',
        ConfigType: 'Server',
    });

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
        OwnerType: formStateCurrent.OwnerType
    };

    const dbConnection = {
        ServerID: selectedServerConnection,
        CollectionCategory: formStateCurrent.OwnerType,
        FriendlyName: formStateCurrent.FriendlyName,
        DatabaseName: formStateCurrent.DatabaseName
    };

    const serverValidationRules = {
        requiredFields: ['ServerName', 'Port', 'DbType', 'AuthType', 'OwnerID', 'OwnerType'],
        ServerName: { type: 'string' },
        Port: { type: 'number' },
        Instance: {type: 'string'},
        DbType: { allowedValues: ['MSSQL', 'Oracle', 'MySQL', 'PostgreSQL', 'MongoDB', 'DB2'] },
        AuthType: { allowedValues: ['Credentials', 'Windows']},
        OwnerType: { allowedValues: ['User', 'Group']}
    };

    const dbValidationRules = {
        requiredFields: [
            ...serverValidationRules.requiredFields,
            'CollectionCategory',
            'FriendlyName',
            'DatabaseName'
        ],
        ...serverValidationRules,
        CollectionCategory: { type: 'string' },
        FriendlyName: { type: 'string' },
        DatabaseName: { type: 'string' }
    };

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
            let newState = { ...prevState, [name]: value };

            if (name === 'ConfigType') {
                setDeleteIden(value === 'Server' ? 'ServerName' : 'FriendlyName');
            } else if (name === 'OwnerType') {
                newState.OwnerID = value === 'Group' ? '' : userID;
            } else if (name === 'DbType') {
                newState.Port = defaultPorts[value];
                newState.AuthType = authTypesByDB[value][0];
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
                ownerID: userID,
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

    // Fetch server connections
    useEffect(() => {
        if (showDbOptions) {
            let url = `/api/connection/`;

            if (formStateCurrent.showConnections === 'OnlyUserOrGroup') {
                let filter = '';
                if (formStateCurrent.OwnerType === 'User') {
                    filter = `ownerId=${userID}&in_ownerType=User`;
                } else if (formStateCurrent.OwnerID !== '') {
                    filter = `ownerId=${formStateCurrent.OwnerID}&in_ownerType=Group`;
                } else {
                    return;
                }
                url += `GetServerConnections?${filter}`;
            } else if (formStateCurrent.showConnections === 'All') {
                url += `GetAllConnectionsForUser?username=${username}&userID=${userID}`;
            } else {
                return;
            }

            const fetchServerConnections = async () => {
                try {
                    const response = await makeApiRequest('get', url);
                    setServerConnections(response.data);
                } catch (error) {
                    console.error('Could not fetch server connections:', error.response ? error.response.data : error);
                }
            };

            fetchServerConnections();
        }
    }, [showDbOptions, formStateCurrent, userID, username, makeApiRequest]);

    const handleSave = async () => {
        let data = formStateCurrent.ConfigType === 'Server' ? serverConnection : dbConnection;
        let endpoint = '';
        let serverId = null;

        if (formStateCurrent.OwnerType === 'User') {
            data.OwnerID = userID;
        }
        
        endpoint = isEditMode
            ? (formStateCurrent.ConfigType === 'Server'
                ? '/api/connection/UpdateServerConnection'
                : '/api/connection/UpdateDBConnection')
            : (formStateCurrent.ConfigType === 'Server'
                ? '/api/connection/AddServerConnection'
                : '/api/connection/AddDBConnection');

        if (formStateCurrent.ConfigType === 'Database' && (!dbConnection.ServerID || dbConnection.ServerID.trim() === '')) {
            try {
                const serverResponse = await makeApiRequest('post', '/api/connection/AddServerConnection', serverConnection);
                serverId = serverResponse.data;
                dbConnection.ServerID = serverId;
                data = dbConnection;
            } catch (error) {
                setIsSuccess(false);
                setMessage("Server connection creation failed.");
                return;
            }
        }

        try {
            await makeApiRequest('post', endpoint, data);
            setIsSuccess(true);
            setMessage(formStateCurrent.ConfigType === 'Server' ? 'Server connection saved.' : 'Database connection saved.');
        } catch (error) {
            setIsSuccess(false);
            setMessage("Saving failed.");
            // If server was created but database creation failed, delete the server
            if (dbConnection.ServerID) {
                const isDeleted = await deleteConnection(serverId, 'Server');
                if (isDeleted) {
                    setMessage("Database creation failed. Created server connection has been deleted.");
                } else {
                    setMessage("Database creation failed, and an error occurred while attempting to delete the server connection.");
                }
            }
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
                                name='existingServer'
                                onChange={_handleChange}
                                    className='input-style-default standard-select'>
                                    <option value={null}>--Select a Connection--</option>
                                {serverConnections.map((server, index) =>
                                    <option key={index} value={server.id}>({server.dbType}): {server.serverName}</option>)}
                                </select><br/><br/>
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
                            <label>Server Name or IP Address</label><br />
                            <input name='ServerName' onChange={_handleChange} className='input-style-default' />
                        </div>
                        <div className='form-element' style={{ alignItems: 'center' }}>
                            <label style={{ marginRight: '10px' }}>Port:</label>
                            <input
                                type='number'
                                name='Port'
                                value={formStateCurrent.Port}
                                onChange={_handleChange}
                                className='input-style-default-short'
                            />
                            {(formStateCurrent.dbType === 'MSSQL' || formStateCurrent.dbType === 'Oracle') && (
                                <>
                                    <label style={{ marginLeft: '20px', marginRight: '10px' }}>Instance:</label>
                                    <input name='instance' onChange={_handleChange} className='input-style-default-short' />
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
                                    <label>Username</label><br />
                                    <input name='Username' onChange={_handleChange} className='input-style-default' />
                                </div>
                                <div className='form-element'>
                                    <label>Password</label><br />
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
                            <label>Database Name</label><br />
                            <input
                                name='DatabaseName'
                                value={formStateCurrent.databaseName}
                                onChange={_handleChange}
                                className='input-style-default'
                            />
                        </div>
                        <div className='form-element'>
                            <label>Friendly Name</label><br />
                            <input
                                name='FriendlyName'
                                value={formStateCurrent.friendlyName}
                                onChange={_handleChange}
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
                        <br/>
                        <label className='success-message'>{testResult}</label><br /><br />
                    </>
                )}
                    <button type="button" onClick={handleSave} className="btn-three">{isEditMode ? 'Update' : 'Save'}</button>
                    {isEditMode && (
                    <button type="button" onClick={deleteConnection} className="btn-three">
                            Delete
                        </button>
                    )}
                    {message && <MessageDisplay message={message} isSuccess={isSuccess} className="success-message"/>}
            </section>
        </div>
    );
};

export default HOC(ConnectionForm);
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HOC from '../components/HOC';
import BaseForm from '../components/BaseForm';

const ConnectionForm = ({ makeApiRequest, username, userID, isEditMode, validateForm, connectionDetails }) => {
    const navigate = useNavigate();
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

    // Form data
    const initialData = {
        serverName: '',
        port: '',
        dbType: 'MSSQL',
        username: '',
        password: '',
        authType: '',
        ownerID: '',
        ownerType: 'User',
        friendlyName: '',
        databaseName: '',
    };
    // Current states
    const [formStateCurrent, setFormStateCurrent] = useState(initialData);

    // Models
    const serverConnection = (state) => ({
        Id: state.Id,
        ServerName: state.serverName,
        Port: state.port,
        Instance: state.instance,
        DbType: state.dbType,
        Username: state.username,
        Password: state.password,
        AuthType: state.authType,
        OwnerID: state.ownerID,
        OwnerType: state.ownerType
    });

    const dbConnection = {
        ServerID: selectedServerConnection,
        CollectionCategory: formStateCurrent.ownerType,
        FriendlyName: formStateCurrent.friendlyName,
        DatabaseName: formStateCurrent.databaseName
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
        if (connectionDetails.id) {
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

    const specialInputLogic = (name, value) => {
        setFormStateCurrent(prevState => {
            let updateState = { ...prevState, [name]: value };

            // Set deleteIden based on the updated configType in updateState
            if (updateState.configType === 'Server') {
                setDeleteIden('serverName');
            } else {
                setDeleteIden('friendlyName');
            }

            if (name === 'ownerType') {
                updateState.ownerID = value === 'Group' ? '' : userID;
            } else if (name === 'ownerID' && updateState.ownerType === 'Group') {
                updateState.ownerID = value;
            } else if (name === 'dbType') {
                updateState = {
                    ...updateState,
                    port: defaultPorts[value],
                    authType: authTypesByDB[value][0]
                };
            }
            return updateState;
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
            setTestResult(data.data);
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
                if (formStateCurrent.ownerType === 'User') {
                    filter = `ownerId=${userID}&in_ownerType=User`;
                } else if (formStateCurrent.ownerID !== '') {
                    filter = `ownerId=${formStateCurrent.ownerID}&in_ownerType=Group`;
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
        const validationRules = formStateCurrent.configType === 'Server' ? serverValidationRules : dbValidationRules;
        const { isValid, errors } = validateForm(formStateCurrent, validationRules);
        if (!isValid) {
            const errorMessages = Object.entries(errors)
                .map(([field, error]) => `${field}: ${error}`)
                .join(', ');
            setMessage(`Form validation errors: ${errorMessages}`);
            return;
        }
        else {
            let data = formStateCurrent.configType === 'Server' ? serverConnection : dbConnection;
            let endpoint = '';
            if (formStateCurrent.ownerType === 'Group') {
                endpoint = isEditMode
                    ? (formStateCurrent.configType === 'Server'
                        ? '/api/connection/UpdateServerConnection'
                        : '/api/connection/UpdateDBConnection')
                    : (formStateCurrent.configType === 'Server'
                        ? '/api/connection/AddServerConnection'
                        : '/api/connection/AddDBConnection');
            }
            else {
                setMessage('Invalid configuration type.');
                return;
            }
            try {
                await makeApiRequest('post', endpoint, data);
                setIsSuccess(true);
                setMessage(formStateCurrent.configType === 'Server' ? 'Server connection saved.' : 'Database connection saved.');
            } catch (error) {
                setIsSuccess(false);
                // TODO: this was messed up by integrating the HOC
                setMessage(`There was an error saving the ${formStateCurrent.configType === 'Server' ? 'server' : 'database'} connection: ${error.response ? error.response.data : error}`);
            }
        }
    };

    const onDelete = async () => {
        await makeApiRequest('delete', `/api/connection/delete`, serverConnection.id);
    };

    return (
        <div className='sub-container outer'>
            <div className='form-header'>
                <h2>Create a New Connection</h2>
            </div>
            <section className='box form-box'>
                <BaseForm
                    initialData={initialData}
                    isEditMode={isEditMode}
                    onSubmit={handleSave}
                    onCustomInputChange={specialInputLogic}
                    onDelete={onDelete}
                    deleteIdentifier={deleteIden}
                >
                {/* Configuration Type Selector */}
                <div>
                    <label>Select Configuration Type</label><br/>
                    <select className='input-style standard-select' name='configType' onChange={specialInputLogic}>
                        <option value='Server'>Server Configuration</option>
                        <option value='Database'>DB Configuration</option>
                    </select><br/><br/>
                    <input
                        type='checkbox'
                        name='useExistingServer'
                        checked={useExistingServer}
                        onChange={(e) => setUseExistingServer(e.target.checked)}
                    />
                    <label>Use Existing Server Connection</label>
                    <br/><br/>
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
                                onChange={specialInputLogic}
                                    className='input-style standard-select'>
                                    <option value={null}>--Select a Connection--</option>
                                {serverConnections.map((server, index) =>
                                    <option key={index} value={server.id}>{server.serverName}</option>)}
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
                            name='dbType'
                            onChange={specialInputLogic}
                            className='input-style standard-select'
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
                            <input name='serverName' onChange={specialInputLogic} className='input-style' />
                        </div>
                        <div className='form-element' style={{ display: 'flex', alignItems: 'center' }}>
                            <label style={{ marginRight: '10px' }}>Port:</label>
                            <input
                                type='number'
                                name='port'
                                value={formStateCurrent.port}
                                onChange={specialInputLogic}
                                className='input-style-short'
                            />
                            {(formStateCurrent.dbType === 'MSSQL' || formStateCurrent.dbType === 'Oracle') && (
                                <>
                                    <label style={{ marginLeft: '20px', marginRight: '10px' }}>Instance:</label>
                                    <input name='instance' onChange={specialInputLogic} className='input-style-short' />
                                </>
                            )}
                        </div>
                        <div className='form-element'>
                            <label>Authentication Type</label><br />
                            <select
                                name='authType'
                                onChange={specialInputLogic}
                                className='input-style standard-select'
                            >
                                {authTypesByDB[formStateCurrent.dbType].map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        {formStateCurrent.authType === 'Credentials' && (
                            <>
                                <div className='form-element'>
                                    <label>Username</label><br />
                                    <input name='username' onChange={specialInputLogic} className='input-style' />
                                </div>
                                <div className='form-element'>
                                    <label>Password</label><br />
                                    <input type='password' name='password' onChange={specialInputLogic} className='input-style' />
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Database Fields */}
                {formStateCurrent.configType === 'Database' && (
                    <>
                    <br/>
                        <div className='form-element'>
                            <label>Database Name</label><br />
                            <input
                                name='databaseName'
                                value={formStateCurrent.databaseName}
                                onChange={specialInputLogic}
                                className='input-style'
                            />
                        </div>
                        <div className='form-element'>
                            <label>Friendly Name</label><br />
                            <input
                                name='friendlyName'
                                value={formStateCurrent.friendlyName}
                                onChange={specialInputLogic}
                                className='input-style'
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
                        {formStateCurrent.ownerType === 'Group' && (
                            <div style={{ flex: 1 }}>
                                <label>Select Group</label>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1 }}>
                            <select
                                name='ownerType'
                                onChange={specialInputLogic}
                                className='input-style-medium'>
                                <option value='User'>Current User</option>
                                <option value='Group'>Group</option>
                            </select>
                        </div>
                        {formStateCurrent.ownerType === 'Group' && (
                            <div style={{ flex: 1 }}>
                                <select
                                    name='ownerID'
                                    onChange={specialInputLogic}
                                    className='input-style-medium'>
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
                </BaseForm>
            </section>
        </div>
    );
};

export default HOC(ConnectionForm);
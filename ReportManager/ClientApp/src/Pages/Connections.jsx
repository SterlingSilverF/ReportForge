import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import HOC from '../components/HOC';
import LoadingComponent from '../components/loading';

const Connections = ({ dbIcons, username, userID, makeApiRequest, goBack, navigate }) => {
    const [connections, setConnections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const serverConnections = connections.filter(conn => conn.connectionType === 'Server');
    const dbConnections = connections.filter(conn => conn.connectionType === 'Database');

    useEffect(() => {
        if (userID !== "" && username !== "") {
            setIsLoading(true);
            setLoadingMessage('Fetching connections...');
            makeApiRequest('get', `/api/connection/GetAllConnectionsForUserAndGroups?userId=${userID}&username=${username}`)
                .then((res) => {
                    setConnections(res.data);
                    setIsLoading(false);
                    setLoadingMessage('');
                })
                .catch((err) => {
                    console.error('There was an error fetching connections!', err);
                    setLoadingMessage('Failed to load connections.');
                    setIsLoading(false);
                });
        }
    }, [makeApiRequest, userID, username]);

    const getIconByConnectionType = (connection) => {
        switch (connection.dbType) {
            case 'MSSQL':
                return dbIcons.mssql;
            case 'Oracle':
                return dbIcons.oracle;
            case 'MySQL':
                return dbIcons.mysql;
            case 'Postgres':
                return dbIcons.postgres;
            case 'MongoDB':
                return dbIcons.mongodb;
            case 'DB2':
                return dbIcons.DB2;
            default:
                return faCaretLeft;
        };
    };

    const handleIconClick = (connectionId, connectionType, ownerId, ownerType) => {
        navigate(`/connectionForm?connectionId=${connectionId}&connectionType=${connectionType}&ownerId=${ownerId}&ownerType=${ownerType}`);
    };

    const ConnectionItem = ({ connection }) => (
        <div
            className="image-label-pair grid-item"
            onClick={() => handleIconClick(connection.id, connection.connectionType, connection.ownerId, connection.ownerType)}>
            <img
                className="connection-icon clickable"
                src={getIconByConnectionType(connection)}
                alt={connection.serverName}/>
            <label>{connection.ownerName} - {connection.serverName}</label>
        </div>
    );

    return (
        <div className="sub-container padding-medium">
            <div className="title-style-one">Connection Explorer</div>
            <LoadingComponent isLoading={isLoading} message={loadingMessage} />
            <button className="btn-three back" onClick={goBack}>
                <FontAwesomeIcon icon={faCaretLeft} /> Back
            </button>
            <hr />
            <div className="section">
                <div className="title-style-one">Server Level Connections</div>
                <div className="grid-container">
                    {serverConnections.map((connection) => <ConnectionItem key={connection.id} connection={connection} />)}
                </div>
            </div>
            <br/><br/>
            <div className="section">
                <div className="title-style-one">Database Specific Connections</div>
                <div className="grid-container">
                    {dbConnections.map((connection) => <ConnectionItem key={connection.id} connection={connection} />)}
                </div>
            </div>
        </div>
    );
};

export default HOC(Connections);
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import HOC from '../components/HOC';

const Connections = ({ dbIcons, username, userID, makeApiRequest, goBack, navigate }) => {
    const [connections, setConnections] = useState([]);

    useEffect(() => {
        if (userID && username)
            makeApiRequest('get', `/api/connection/GetAllConnectionsForUserAndGroups?userId=${userID}&username=${username}`)
                .then((res) => {
                    setConnections(res.data);
                })
                .catch((err) => console.error('There was an error fetching connections!', err));
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

    const handleIconClick = (connectionId) => {
        navigate(`/connectionForm`);
    }

    return (
        <div className="sub-container padding-medium">
            <div className="title-style-one">Connection Explorer</div>
            <button className="btn-three back" onClick={goBack}>
                <FontAwesomeIcon icon={faCaretLeft} /> Back
            </button>
            <hr />
            <div className="grid-container">
                {connections.map((connection, index) => (
                    <div key={index} className="image-label-pair grid-item" onClick={() => handleIconClick(connection.id)}>
                        <img
                            className="connection-icon"
                            src={getIconByConnectionType(connection)}
                            alt={connection.serverName} />
                        <label>{connection.ownerName} - {connection.serverName}</label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HOC(Connections);
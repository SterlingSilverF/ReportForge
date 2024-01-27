import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import HOC from '../components/HOC';

const Connections = ({ dbIcons, env, token, username, userID, makeApiRequest, goBack, navigate }) => {
    const [connections, setConnections] = useState([]);

    useEffect(() => {
        makeApiRequest('get', '/api/connections/getConnections')
            .then((res) => {
                setConnections(res.data);
            })
            .catch((err) => console.error('There was an error fetching connections!', err));
    }, [makeApiRequest]);

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

    return (
        <div className="sub-container padding-medium">
            <div className="title-style-one">Connection Explorer</div>
            <button className="btn-three back" onClick={goBack}>
                <FontAwesomeIcon icon={faCaretLeft} /> Back
            </button>
            <hr />
            <div className="grid-container">
                {connections.map((connection, index) => (
                    <div key={index} className="image-label-pair grid-item">
                        <FontAwesomeIcon
                            className="connection-icon"
                            icon={getIconByConnectionType(connection)}
                            size="5x"
                        />
                        <label>{connection.name}</label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HOC(Connections);
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import HOC from "../components/HOC";
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ dbIcons, env, makeApiRequest, userID }) => {
    const [userConnections, setUserConnections] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (userID != '') {
            makeApiRequest('get', `/api/connection/GetServerConnections?ownerId=${userID}&in_ownerType=User`)
                .then(response => {
                    setUserConnections(response.data);
                })
                .catch(error => {
                    console.error('Could not fetch user connections');
                });
        }
    }, [makeApiRequest, userID]);
    
    const getIconByDbType = (dbType) => {
        switch (dbType) {
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
                return faFolder;
        }
    };

    return (
        <div className="dashboard-container">
            <div className="sub-container">
                <div className="header">
                    <h3>Welcome to the Dashboard</h3>
                    <p className="rpf-gold">Enviornment: {env}</p>
                </div>
                <div className="padding-medium">
                    <section className="get-started">
                        <h2>Get Started</h2>
                        <hr></hr>
                        <div className="inline-buttons">
                            <button className="btn-two" onClick={() => navigate('/connectionform')}>Add a new connection</button>
                            <button className="btn-two" onClick={() => navigate('/createreport')}>Create a new report</button>
                            <button className="btn-two" onClick={() => navigate('/createfolder')}>Create a new folder</button>
                            <button className="btn-two" onClick={() => navigate('/creategroup')}>Create a new group</button>
                        </div>
                    </section>
                    <br/><br/><br/>
                    <section className="box">
                        <h3>My folders</h3>
                        <hr></hr>
                        <div className="image-label-pair">
                            <FontAwesomeIcon icon={faFolder} size="5x" className="folder"/>
                            <label>Some Text</label>
                        </div>
                        <br/><br/>
                    </section>
                    <section className="box">
                        <h3>My reports</h3>
                        <hr></hr>
                        <br /><br />
                    </section>
                    <section className="box">
                        <h3>My connections</h3>
                        <hr></hr>
                        <div className="connections-list">
                            {userConnections.slice(0, 10).map((connection, index) => (
                                <div key={index} className="image-label-pair">
                                    <img src={getIconByDbType(connection.dbType)} className="folder" />
                                    <label>{connection.server}</label>
                                </div>
                            ))}
                        </div>
                        <br /><br />
                    </section>
                </div>
            </div>
            <div className="right-bar">
                <h4>Report History</h4>
                <hr />
                <div className="item"></div>
            </div>
        </div>
    );
};

export default HOC(Dashboard);
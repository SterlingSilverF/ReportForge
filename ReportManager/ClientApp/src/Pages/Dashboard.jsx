import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faPeopleRoof, faPerson } from '@fortawesome/free-solid-svg-icons';
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
                <div className="padding-medium">
                    <section className="get-started">
                        <h2>Get Started</h2>
                        <hr></hr>
                        <div className="inline-buttons">
                            <button className="btn-two" onClick={() => navigate('/connectionform')}>Add a new connection</button>
                            <button className="btn-two" onClick={() => navigate('/reportform')}>Create a new report</button>
                            <button className="btn-two" onClick={() => navigate('/folderform')}>Create a new folder</button>
                            <button className="btn-two" onClick={() => navigate('/groupform')}>Create a new group</button>
                        </div>
                        <hr></hr>
                    </section>
                    <br/>
                    <section className="box">
                    <div className="no-break double-split merge-border-left">    
                            <h2>Browse Personal Items</h2>
                        <FontAwesomeIcon
                        className="select-icon"
                        icon={faPerson}
                        size="9x"
                        onClick={() => navigate(`/browse?isPersonal=true`)}
                    />
                    </div>
                    <div className="no-break double-split merge-border-right">
                            <h2>Browse Group Items</h2>
                            <FontAwesomeIcon
                                className="select-icon"
                                icon={faPeopleRoof}
                                size="9x"
                                onClick={() => navigate(`/browse?isPersonal=false`)}
                            />
                    </div>
                    </section>
                    <br/>
                </div>
            </div>
            <div className="right-bar">
                <h4>Announcements</h4>
                <hr />
                <div className="item">
                <a>Demo: Click Here to View Development Status</a>
                </div>
            </div>
        </div>
    );
};

export default HOC(Dashboard);
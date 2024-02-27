import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faPeopleRoof, faPerson } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import HOC from "../components/HOC";

const Dashboard = ({ dbIcons, env, makeApiRequest, userID, navigate }) => {
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
                        <h2>Build and Organize</h2>
                        <hr></hr>
                        <div className="inline-buttons">
                            <button className="btn-two" onClick={() => navigate('/groupform')}>Create a new group</button>
                            <button className="btn-two" onClick={() => navigate('/folderform')}>Create a new folder</button>
                            <button className="btn-two" onClick={() => navigate('/connectionform')}>Add a new connection</button>
                            <button className="btn-two" onClick={() => navigate('/reportform')}>Create a new report</button>
                        </div>
                        <hr></hr>
                    </section>
                    <h3>Your Workspace</h3><br/>
                    <section className="box">
                        <div className="browse-personal no-break double-split" onClick={() => navigate(`/browse?isPersonal=true`)}>
                            <h2>Personal Content</h2>
                            <FontAwesomeIcon
                                className="select-icon"
                                icon={faPerson}
                                size="9x"  
                            />
                        </div>
                        <div className="browse-group no-break double-split" onClick={() => navigate(`/browse?isPersonal=false`)}>
                            <h2>Group Content</h2>
                            <FontAwesomeIcon
                                className="select-icon"
                                icon={faPeopleRoof}
                                size="9x"
                            />
                        </div>
                    </section>
                    <br /><br/><br/><hr/>
                    <section className="recent-actions">
                        <h2>Recent Activity</h2>
                        <p>Sample text for recent actions...</p>
                        {/* TODO: Implement functionality to display recent actions */}
                    </section>
                </div>
            </div>
            <div className="right-bar">
                <h3>Announcements</h3>
                <hr />
                <div className="item">
                    <a>Capstone Submission</a>
                    <p>This application is being used as a capstone project.</p>
                    <a>Settings Under Construction</a>
                    <p>Only some settings are currently availible in settings.</p>
                </div>
            </div>
        </div>
    );
};

export default HOC(Dashboard);
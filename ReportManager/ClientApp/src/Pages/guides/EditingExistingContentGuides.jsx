import React from 'react';
import navigation from '../../components/Images/navigation.PNG';
import groupinfo from '../../components/Images/groupinfo.PNG';
import groups from '../../components/Images/groups.PNG';
import editgroup from '../../components/Images/editgroup.PNG';
import deletegroup from '../../components/Images/deletegroup.PNG';
import connections from '../../components/Images/connections.PNG';
import editconnection from '../../components/Images/editconnection.PNG';
import reports from '../../components/Images/reports.PNG';
import reportinfo from '../../components/Images/reportinfo.PNG';

const EditingExistingContentGuides = () => {
    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Editing Existing Content Guides</h1>
                <hr />
            </div>
            <div className="report-form-box" style={{ display: 'flex' }}>
                <ul style={{ listStyleType: 'none', padding: 0, flex: '1 0 20%', marginRight: '20px' }}>
                    <li><a href="/guides/editing-existing-content#editing-and-managing-groups">Editing and Managing Groups</a></li>
                    <li><a href="/guides/editing-existing-content#editing-existing-connections">Editing Existing Connections</a></li>
                    <li><a href="/guides/editing-existing-content#editing-existing-reports">Editing Existing Reports</a></li>
                </ul>
                <div style={{ flex: '3 1 75%' }}>
                    {/* Example subsection for a guide */}
                    <section id="editing-and-managing-groups">
                        <h2>Editing and Managing Groups</h2>
                        <p>Group statistics and properties can be viewed by selecting a group you are a member of from the groups tab in the main navigation:</p>
                        <img src={navigation} />
                        <img src={groups} style={{ width: '95%' }} />
                        <br/><br/>
                        <p>As a group owner, you can generate access codes for new users that grant them inital permissions. You can set the keys to expire after a certain amount of time or have them last indefinitely. To invalidate all keys, use the "Clear Keys" button.</p>
                        <img src={groupinfo} style={{ width: '95%' }} />
                        <br/><br/>
                        <p>Editing groups works similarly to creating them. Once you are done changing members or owners, you can hit save changes.</p>
                        <img src={editgroup} />
                        <img src={deletegroup} />
                        <br/><br/>
                        <b>If you delete a group, ALL data underneath it will be deleted, so be careful!</b>
                    </section>
                    <br/>
                    {/* Additional sections for other guides */}
                    <section id="editing-existing-connections">
                        <h2>Editing Existing Connections</h2>
                        <p>Similarly, accessing a list of connections can be done by clicking on the "Connections" tab on the main navigation.</p>
                        <img src={connections} style={{ width: '95%' }} />
                        <br/><br/>
                        <p>Here, you can view all connections saved under your user or groups you are a member of. They are split out into partial (server) and complete (database) connections. Only complete database connections can be used for reports.</p>
                        <img src={editconnection} style={{ width: '55%' }} />
                        <br/><br/>
                        <p>Most notably, if you wish to update a saved connection, you will need to know the sign-on information (if the authentication is via username and password).</p>
                        <p>Connections cannot be transferred between owners in this way. Connections can be updated or deleted from this screen. On delete, any report configurations using the connection may break if they refer to it.</p>
                    </section>
                    <br/>
                    <section id="editing-existing-reports">
                        <h2>Editing Existing Reports</h2>
                        <p>To begin editing an existing report configuration, browse to the reports tab using the main navigation:</p>
                        <img src={reports} style={{ width: '95%' }} />
                        <br/><br/>
                        <p>Select one by clicking on a file icon.</p>
                        <img src={reportinfo} style={{ width: '95%' }} />
                        <br/><br/>
                        <p>Hitting the "Edit This Report" button will navigate to the first page in the report designer with all values pre-loaded. Please note that some attributes cannot be changed such as the owner and database connection.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default EditingExistingContentGuides;
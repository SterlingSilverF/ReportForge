import React from 'react';
import groupform from '../../components/Images/groupform.PNG';
import folderform from '../../components/Images/folderform.PNG';
import connectionform from '../../components/Images/connectionform.PNG';

const AddingNewContentGuides = () => {
    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Adding New Content Guides</h1>
                <hr/>
            </div>
            <div className="report-form-box" style={{ display: 'flex' }}>
                <ul style={{ listStyleType: 'none', padding: 0, flex: '1 0 20%', marginRight: '20px' }}>
                    <li><a href="/guides/adding-new-content#creating-a-new-group">Creating a New Group</a></li>
                    <li><a href="/guides/adding-new-content#creating-a-folder">Creating a Folder</a></li>
                    <li><a href="/guides/adding-new-content#creating-a-connection">Creating a Connection</a></li>
                    <li><a href="/guides/adding-new-content#creating-a-report">Creating a Report</a></li>
                </ul>
                <div style={{ flex: '3 1 75%' }}>
                    {/* Example subsection for a guide */}
                    <section id="creating-a-new-group">
                        <h2>Creating a New Group</h2>
                        <img src={groupform}></img>
                        <p>To create a new group:</p>
                        <ol>
                            <li>Click on "Create a new group" from the dashboard page.</li>
                            <li>Enter the group name and add any group owners and group members. Any group owners are automatically group members.</li>
                            <li>The left box displays available users, and the right displays added users.</li>
                            <li>Click a username and use the single arrow to move them.
                                Use the double arrow to move all currently displayed users at once. The search bar can be used to filter them.</li>
                            <li>Click "Create" to finalize the process.
                                A success or failure message will display, and you will be given the option to clear the form or return to the dashboard.</li>
                        </ol>
                    </section>
                    {/* Additional sections for other guides */}
                    <section id="creating-a-folder">
                        <h2>Creating a New Folder</h2>
                        <img src={folderform}></img>
                        <p>To create a new folder:</p>
                        <ol>
                            <li>Click on "Create a new folder" from the dashboard page.</li>
                            <li>Enter a name for the folder.</li>
                            <li>Next, you should select if you want it to be one of your own folders or for a group using the type radio button.</li>
                            <li>If you have selected Group, you'll need to specify which group.</li>
                            <li>Finally, you'll select which folder you want the new folder to be stored under. This works like a filesystem.
                                If you want it to be at the top of a group or your personal content, you should select the folder named the same thing as the group or your username.</li>
                            <li>Click "Create" to finalize the process.
                                A success or failure message will display, and you will be given the option to clear the form or return to the dashboard.</li>
                        </ol>
                    </section>
                    <section id="creating-a-connection">
                        <h2>Creating a Connection</h2>
                        <p>This section is not meant to explain database terms. See <a href="/guides/databases">Database Guides</a> to learn more.</p>
                        <img src={connectionform} style={{ width: '50%', height: '50%' }}></img>
                        <p>To create a new connection:</p>
                        <ol>
                            <li>Click on "Create a new connection" from the dashboard page.</li>
                            <li>Starred fields are required.</li>
                            <li>There are two types of connections that can be saved:
                                <ul>
                                    <li>Server Configuration: Also called a "base" connection. Since database servers often contain multiple databases,
                                        this is to make your life easier when adding new connections (this is what the "Use Existing Server Connection" checkbox is for).</li>
                                    <li>DB Configuration: Full database connection configurations, required for reports.</li>
                                </ul>
                            </li>
                            <li>The database provider selection influences whether or not some fields display.</li>
                            <li>Some fields only display for database configurations.</li>
                            <li>You can choose to save a connection configuration underneath your own username or a group.
                                If you save it under a group, it will be accessible to all users in it, so never add
                                connections to a group they would not normally be permitted to access data from.</li>
                            <li>Once the form is filled out, it is recommended to use the "Test Connection" button to verify connectivity before saving.</li>
                            <li>Click "Create Connection" to finalize. A success or failure message will display, and you will be given the option to clear the form or return to the dashboard.</li>
                        </ol>
                    </section>
                    <section id="creating-a-report">
                        <h2>Creating a Report</h2>
                        <p>To create a new report:</p>
                        <ol>
                            <li>Click on the "Reports" tab.</li>
                            <li>Click the "New Report" button.</li>
                            <li>Select the data source for the report.</li>
                            <li>Design the report layout and add necessary components (charts, tables, etc.).</li>
                            <li>Save the report when finished.</li>
                        </ol>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AddingNewContentGuides;
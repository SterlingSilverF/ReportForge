import React from 'react';

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
                        <p>To create a new group:</p>
                        <ol>
                            <li>Click on the "Groups" tab in the navigation menu.</li>
                            <li>Click the "Create Group" button.</li>
                            <li>Enter the group name and description.</li>
                            <li>Optionally, invite members to the group by entering their email addresses.</li>
                            <li>Click "Create" to finalize the group creation process.</li>
                        </ol>
                    </section>
                    {/* Additional sections for other guides */}
                    <section id="creating-a-folder">
                        <h2>Creating a Folder</h2>
                        <p>To create a new folder:</p>
                        <ol>
                            <li>Navigate to the location where you want to create the folder.</li>
                            <li>Click the "New Folder" button.</li>
                            <li>Enter the folder name.</li>
                            <li>Click "Create" to finalize the folder creation process.</li>
                        </ol>
                    </section>
                    <section id="creating-a-connection">
                        <h2>Creating a Connection</h2>
                        <p>To create a new connection:</p>
                        <ol>
                            <li>Go to the "Connections" section.</li>
                            <li>Click the "New Connection" button.</li>
                            <li>Select the type of connection (e.g., database, API).</li>
                            <li>Enter the required connection details.</li>
                            <li>Click "Save" to establish the connection.</li>
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
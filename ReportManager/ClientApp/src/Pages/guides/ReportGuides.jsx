import React from 'react';

const ReportsGuides = () => {
    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Reports Guides</h1>
                <hr/>
            </div>
            <div className="report-form-box" style={{ display: 'flex' }}>
                <ul style={{ listStyleType: 'none', padding: 0, flex: '1 0 20%', marginRight: '20px' }}>
                    <li><a href="#report-settings">Report Settings</a></li>
                    <li><a href="#setting-up-automated-tasks">Informaton on Retention & Automated Tasks</a></li>
                </ul>
                <div style={{ flex: '3 1 75%' }}>
                    <section id="report-settings">
                        <h2>Report Settings</h2>
                        <p>(To be filled out when additional expanded features are shipped.)</p>
                    </section>
                    <section id="setting-up-automated-tasks">
                        <h2>Information on Retention & Automated Tasks</h2>
                        <p>An automated service called the ReportDaemon runs on the application server and handles the creation and deletion of reports.
                            When a file creation date passes the related report configuration retention date, it will be picked up and deleted by the service.</p>
                        <p>Hypothetically in the future, a nice to have feature will be the ability to migrate existing report files into a different folder.</p>
                        <p>In a business production environment, the tool is designed to be scaled to include permissions management, including both the report files and folders themselves.
                            In edge cases where the application can't easily preform certain file management operations, users with the correct permissions could access the location both for convenience and for managing the files.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ReportsGuides;
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
                    <li><a href="#viewing-existing-reports">Viewing Existing Reports</a></li>
                    <li><a href="#report-settings">Report Settings</a></li>
                    <li><a href="#setting-up-automated-tasks">Setting Up Automated Tasks</a></li>
                </ul>
                <div style={{ flex: '3 1 75%' }}>
                    {/* Example subsection for a guide */}
                    <section id="viewing-existing-reports">
                        <h2>Viewing Existing Reports</h2>
                        <p>Guide content...</p>
                    </section>
                    {/* Additional sections for other guides */}
                    <section id="report-settings">
                        <h2>Report Settings</h2>
                        <p>Guide content...</p>
                    </section>
                    <section id="setting-up-automated-tasks">
                        <h2>Setting Up Automated Tasks</h2>
                        <p>Guide content...</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ReportsGuides;
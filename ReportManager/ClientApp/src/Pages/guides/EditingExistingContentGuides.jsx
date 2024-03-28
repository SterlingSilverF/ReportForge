import React from 'react';

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
                        <p>Guide content...</p>
                    </section>
                    {/* Additional sections for other guides */}
                    <section id="editing-existing-connections">
                        <h2>Editing Existing Connections</h2>
                        <p>Guide content...</p>
                    </section>
                    <section id="editing-existing-reports">
                        <h2>Editing Existing Reports</h2>
                        <p>Guide content...</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default EditingExistingContentGuides;
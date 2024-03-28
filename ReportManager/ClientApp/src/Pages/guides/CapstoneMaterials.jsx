import React from 'react';

const CapstoneMaterials = () => {
    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Capstone Materials</h1>
                <hr />
            </div>
            <div className="report-form-box" style={{ display: 'flex' }}>
                <ul style={{ listStyleType: 'none', padding: 0, flex: '1 0 20%', marginRight: '20px' }}>
                    <li><a href="#application-design-document">Application Design Document</a></li>
                    <li><a href="#test-plan">Test Plan</a></li>
                    <li><a href="#admin-setup-guide">Admin Setup Guide</a></li>
                    <li><a href="#user-guide">User Guide</a></li>
                </ul>
                <div style={{ flex: '3 1 75%' }}>
                    {/* Example subsection for a guide */}
                    <section id="application-design-document">
                        <h2>Application Design Document</h2>
                        <p>Guide content...</p>
                    </section>
                    {/* Additional sections for other guides */}
                    <section id="test-plan">
                        <h2>Test Plan</h2>
                        <p>Guide content...</p>
                    </section>
                    <section id="admin-setup-guide">
                        <h2>Admin Setup Guide</h2>
                        <p>Guide content...</p>
                    </section>
                    <section id="user-guide">
                        <h2>User Guide</h2>
                        <p>Guide content...</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CapstoneMaterials;
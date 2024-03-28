import React from 'react';

const WorkspaceGuides = () => {
    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Workspace Guides</h1>
                <hr />
            </div>
            <div className="report-form-box" style={{ display: 'flex' }}>
                {/* Left-side navigation (optional) */}
                <nav className="guide-nav" style={{ flex: '1 0 20%', marginRight: '20px' }}>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        <li><a href="/guides/workspace#navigating-the-app">Navigating the App</a></li>
                        <li><a href="/guides/workspace#personal-vs-group-content">Personal vs. Group Content</a></li>
                        <li><a href="/guides/workspace#what-is-reportforge">What is ReportForge?</a></li>
                    </ul>
                </nav>

                {/* Guide content */}
                <div style={{ flex: '3 1 75%' }}>
                    <section id="what-is-reportforge">
                        <h2>What is ReportForge?</h2>
                        <p>ReportForge is your all-in-one reporting powerhouse, designed to consolidate reporting needs into a single, robust platform.</p>
                        <p>It bridges the gap between developers and business professionals, allowing anyone to create and manage reports
                            with ease. This integration streamlines workflows, liberates developer time for high-impact projects, and
                            embeds data-driven decision-making into the fabric of your operations.</p>
                    </section>
                    <section id="navigating-the-app">
                        <h2>Navigating the App</h2>
                        <p></p>
                    </section>
                    <section id="personal-vs-group-content">
                        <h2>Personal versus Group Content</h2>
                        <b>What is personal content?</b>
                        <p>Personal content are items that you have made and stored under your own user account.</p>
                        <p>Every user gets a folder automatically upon creation of their account.</p>
                        <p>You can leverage this for working on report designs or for demonstration purposes without having to worry about who has access or visibility.</p>
                        <br/>
                        <b>What is group content?</b>
                        <p>Conversely, group content are items that are made and categorized specifically under a single group.</p>
                        <p>Everyone in a group will have access to view anything you add in it. Additionally, any group owners can modify or delete items you have added.</p>
                        <p>Group items such as connections and reports can be great, but do not add connections with credentials higher than anyone in your group would already have in your corporate network.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceGuides;
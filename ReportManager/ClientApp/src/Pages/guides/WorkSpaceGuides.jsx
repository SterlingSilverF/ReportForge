import React from 'react';
import nav from '../../components/Images/navigation.PNG';
import reportinfo from '../../components/Images/reportinfo.PNG';
import connections from '../../components/Images/connections.PNG';
import settings from '../../components/Images/settings.PNG';
import personal1 from '../../components/Images/personal1.PNG';
import personal2 from '../../components/Images/personal2.PNG';
import groupcontent from '../../components/Images/groupcontent.PNG';

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
                        <li><a href="/guides/workspace#what-is-reportforge">What is ReportForge?</a></li>
                        <li><a href="/guides/workspace#navigating-the-app">Navigating the App</a></li>
                        <li><a href="/guides/workspace#personal-vs-group-content">Personal vs. Group Content</a></li>
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
                        <p>ReportForge is primarily navigated using the top bar menu:</p>
                        <img src={nav}></img>
                        <br /><br/>
                        <p>The reports tab is designed to allow you to browse all reports you have created, regardless of ownership (group or personal).
                            It is a flat list of reports you have made, ignoring the location they are stored.</p>
                        <p>You can click on any report on this page to view information on it and view any saved report files connected to the configuration.</p>
                        <img src={reportinfo} style={{ width: '95%', height: '95%' }} ></img>
                        <br/><br/>
                        <p>You can also edit the report configuration itself from here.</p>
                        <p>The groups tab is for viewing and editing group configuration. Only group owners can edit them and manage access keys.
                            Similar to reports, groups are a "flat" list.</p>
                        <p>The connections tab displays connections divided into two categories:</p>
                        <img src={connections} style={{ width: '80%', height: '80%' }} ></img>
                        <br/><br/>
                        <p>The database provider is identified using the icon next to a connection, followed by the owner - server name
                            OR the friendly display name in the case of a full database connection.</p>
                        <p>You can directly edit a connection by clicking on it here.</p>
                        <b>If a connection uses credentials for authentication, the password will need to be re-entered to edit it.</b>
                        <br/><br/>
                        <p>Finally, there is the settings icon:</p>
                        <img src={settings}></img>
                        <br/><br/>
                        <p>The navigation for this section is separate from others in the app. As you see, there are five tabs here. When a tab is selected, it is colored yellow.</p>
                        <p>The User Management, Group Management, and Metrics tabs are only viewable to app administrators.
                            At this time, some functions of this section are not yet operational, but they will be in future.</p>
                    </section>
                    <section id="personal-vs-group-content">
                        <h2>Personal versus Group Content</h2>
                        <b>What is personal content?</b>
                        <p>Personal content are items that you have made and stored under your own user account.</p>
                        <p>Every user gets a folder automatically upon creation of their account.</p>
                        <p>You can leverage this for working on report designs or for demonstration purposes without having to worry about who has access or visibility.</p>
                        <br/>
                        <b>What is group content?</b>
                        <p>Conversely, group content is items that are made and categorized specifically under a single group.</p>
                        <p>Everyone in a group will have access to view anything you add in it. Additionally, any group owners can modify or delete items you have added.</p>
                        <p>Group items such as connections and reports can be great, but do not add connections with credentials higher than anyone in your group would already have in your corporate network.</p>
                        <br />
                        <b>Navigation: Personal & Group Content</b>
                        <img src={personal1} style={{ width: '90%', height: '90%' }} ></img>
                        <img src={personal2} style={{ width: '90%', height: '90%' }} ></img>
                        <br /><br />
                        <p>In the personal section, items are automatically displayed from your personal user folder.</p>
                        <p>Navigating these sections is the same as a typical computer file system; items are stored in folders and folders can be nested.
                            Utilizing the back button returns you to the previous folder you were in.</p>
                        <p>Folders are exclusively edited from these sections by using the pencil icon next to each of them.</p>
                        <br />
                        <img src={groupcontent} style={{ width: '90%', height: '90%' }}></img>
                        <br/><br/>
                        <p>The difference between the personal and group item pages is the default loaded items;
                            the group content page automatically loads a list of groups to choose from to begin your navigation.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceGuides;
import React from 'react';
import groupform from '../../components/Images/groupform.PNG';
import folderform from '../../components/Images/folderform.PNG';
import connectionform from '../../components/Images/connectionform.PNG';
import reportform_one from '../../components/Images/reportform1.PNG';
import reportform_two from '../../components/Images/reportform2.PNG';
import reportform_three from '../../components/Images/reportform3.PNG';
import reportform_four from '../../components/Images/reportform4.PNG';
import reportform_five from '../../components/Images/reportform5.PNG';
import reportform_six from '../../components/Images/reportform6.PNG';
import join_chart_one from '../../components/Images/join_chart1.png';
import join_chart_two from '../../components/Images/join_chart2.png';

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
                            <li>First, select the create new report form from the dashboard. You will need a valid database connection.</li>
                            <br/>
                            <img src={reportform_one} style={{width: '95%'}} />
                            <br/>
                            <span>This is page 1 of 6 of the report form. Here, you fill in the basic details of the report you are making. Make sure to name it something distinct and give it a proper description.</span>
                            <br /><br />
                            <span>While you can choose to store reports in a group or user folder, it is recommended you create a separate folder for them first to keep reports separate.</span>
                            <br /><br />
                            <li>Page 2 of the report form is named the Report Designer.</li>
                            <br />
                            <img src={reportform_two} style={{ width: '95%' }} />
                            <br />
                            <span>One must select tables before selecting columns in them. Columns from selected tables will appear in the righthand box. The columns are displayed with first the column name followed by the datatype and length (where applicable).</span>
                            <br />
                            <img src={reportform_three} style={{ width: '95%' }} />
                            <br /><br />
                            <span>When creating your report configuration, you will almost always want to include data from two or more tables. When more than one table is selected, the join configuration section appears on the page. All included tables must be joined to the query (signified by green check marks). Any red X's will result in the form rejecting the configuration.</span>
                            <br /><br />
                            <span>To do this, you need to specify in the query how the tables are related to each other. Each table must be joined once, and it can be done a couple of different ways: </span>
                            <br />
                            <img src={join_chart_one} style={{ width: '30%' }} />
                            <img src={join_chart_two} style={{ width: '40%' }} />
                            <br />
                            <span>In image one, we see one way of joining tables. In this example, we are able to create a join between A and B, and then with B and C, given there is no direct shared column in tables A and C. In the scenario for image 2, Table A contains a shared column with both B and C. Notably, the shared column for A and C are named differently, but hypothetically hold the same type of data.</span>
                            <br /><br />
                            <span>Below is shown the modifiers section of the report designer:</span>
                            <img src={reportform_four} style={{ width: '95%' }} />
                            <br />
                            <span>Any number of filters and order bys can be added here. Filters are integral to returning the data you want in your report. When adding more than one filter, the operator dropdown will appear; it is important to consider whether AND or OR is the proper selection.</span>
                            <br /><br />
                            <span>In version 1.0 of reportforge, multiple AND and OR clauses are assumed to be evaluated as such: (A AND B) OR C where the AND would be applied to A and B, rather than A AND (B OR C).</span>
                            <br /><br />
                            <li>Page 3 of the report form is the Report Preview.</li>
                            <img src={reportform_five} style={{ width: '95%' }} />
                            <br />
                            <span>Within this page, one can rearrange the order of their selected columns, search the data, and download it if they wish.</span>
                            <br />
                            <span>In addition, this page has an option to display the constructed SQL query for convenient access, tweaking, or troubleshooting.</span>
                            <br />
                            <span>Once these adjustments are complete, we proceed to the final form page.</span>
                            <br /><br />
                            <li>Page 4 of the report form is the Report Configuration.</li>
                            <img src={reportform_six} style={{ width: '60%' }} />
                            <br />
                            <span>Here you can review the name and description of the report once more before saving it.</span>
                            <br /><br />
                            <span>Along with those aspects, the output attributes are set here.</span>
                            <br />
                            <span>The output format is the format for automatically ran reports. The time displayed is relative to the system time of the server.</span>
                            <br />
                            <span>Automatic emails for each generated report can be set as well.</span>
                            <br />
                            <span>Finally, the configuration can be saved. A message will display at the bottom confirming the action.</span>
                        </ol>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AddingNewContentGuides;
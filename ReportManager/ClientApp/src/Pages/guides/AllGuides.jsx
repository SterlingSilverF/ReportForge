import React from 'react';

const AllGuides = () => {
    const categories = {
        "Workspace": [
            { title: "What Is ReportForge?", url: "/guides/workspace#what-is-reportforge" },
            { title: "Navigating the App", url: "/guides/workspace#navigating-the-app" },
            { title: "Personal Versus Group Content", url: "/guides/workspace#personal-vs-group-content" },
        ],
        "Adding New Content": [
            { title: "Creating a New Group", url: "/guides/adding-new-content#creating-a-new-group" },
            { title: "Creating a Folder", url: "/guides/adding-new-content#creating-a-folder" },
            { title: "Creating a Connection", url: "/guides/adding-new-content#creating-a-connection" },
            { title: "Creating a Report", url: "/guides/adding-new-content#creating-a-report" },
        ],
        "Editing Existing Content": [
            { title: "Editing and Managing Groups", url: "/guides/editing-existing-content#editing-and-managing-groups" },
            { title: "Editing Existing Connections", url: "/guides/editing-existing-content#editing-existing-connections" },
            { title: "Editing Existing Reports", url: "/guides/editing-existing-content#editing-existing-reports" },
        ],
        "Databases": [
            { title: "What Is a Database?", url: "/guides/databases#what-is-a-database" },
            { title: "About Columns and Datatypes", url: "/guides/databases#about-columns-and-datatypes" },
            { title: "What Are Joins?", url: "/guides/databases#what-are-joins" },
            { title: "Filters, Conditionals, and Order By", url: "/guides/databases#filters-conditionals-order-by" },
        ],
        "Reports": [
            { title: "Viewing Existing Reports", url: "/guides/reports#viewing-existing-reports" },
            { title: "Report Settings", url: "/guides/reports#report-settings" },
            { title: "Setting Up Automated Tasks", url: "/guides/reports#setting-up-automated-tasks" },
        ],
        "Capstone Materials": [
            { title: "Application Design Document", url: "https://www.figma.com/design/U2jQG4fA2o0608XDrRbBJ6/ReportForge-Class-Diagram?node-id=0-1&t=SblfWmNhrCyJhTQB-1" },
            { title: "Test Plan", url: "/guides/capstone-materials#test-plan" },
        ],
    };

    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h2>Guide Directory</h2>
                <hr />
            </div>
            <section className="report-form-box" style={{ display: 'flex', flexWrap: 'wrap' }}>
                {Object.entries(categories).map(([categoryName, guides]) => (
                    <div key={categoryName} style={{ flex: '1 0 30%', margin: '10px', boxSizing: 'border-box' }}>
                        <h3>{categoryName}</h3>
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {guides.map((guide) => (
                                <li key={guide.title} style={{ marginBottom: '10px' }}>
                                    <a href={guide.url} style={{ textDecoration: 'none', color: 'blue' }}>{guide.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default AllGuides;
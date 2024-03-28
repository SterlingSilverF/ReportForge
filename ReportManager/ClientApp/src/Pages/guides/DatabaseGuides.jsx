import React from 'react';

const DatabasesGuides = () => {
    return (
        <div className="report-form-style">
            <div className="report-form-header">
                <h1>Databases Guides</h1>
                <hr/>
            </div>
            <div className="report-form-box" style={{ display: 'flex' }}>
                <ul style={{ listStyleType: 'none', padding: 0, flex: '1 0 20%', marginRight: '20px' }}>
                    <li><a href="#what-is-a-database">What is a Database?</a></li>
                    <li><a href="#about-columns-and-datatypes">About Columns and Datatypes</a></li>
                    <li><a href="#what-are-joins">What are Joins?</a></li>
                    <li><a href="#filters-conditionals-and-order-by">Filters, Conditionals, and Order By</a></li>
                </ul>
                <div style={{ flex: '3 1 75%' }}>
                    {/* Example subsection for a guide */}
                    <section id="what-is-a-database">
                        <h2>What is a Database?</h2>
                        <p>Guide content...</p>
                    </section>
                    {/* Additional sections for other guides */}
                    <section id="about-columns-and-datatypes">
                        <h2>About Columns and Datatypes</h2>
                        <p>Guide content...</p>
                    </section>
                    <section id="what-are-joins">
                        <h2>What are Joins?</h2>
                        <p>Guide content...</p>
                    </section>
                    <section id="filters-conditionals-and-order-by">
                        <h2>Filters, Conditionals, and Order By</h2>
                        <p>Guide content...</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DatabasesGuides;
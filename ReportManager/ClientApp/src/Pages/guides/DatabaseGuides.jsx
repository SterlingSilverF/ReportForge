import React from 'react';

const DatabasesGuides = ({ dbIcons }) => {
    const getIconByConnectionType = (connection) => {
        switch (connection.dbType) {
            case 'MSSQL':
                return dbIcons.mssql;
            case 'Oracle':
                return dbIcons.oracle;
            case 'MySQL':
                return dbIcons.mysql;
            case 'Postgres':
                return dbIcons.postgres;
            case 'MongoDB':
                return dbIcons.mongodb;
            case 'DB2':
                return dbIcons.DB2;
            default:
                return '';
        };
    };

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
                    {/* Introduction to What a Database Is */}
                    <section id="what-is-a-database">
                        <h2>What is a Database?</h2>
                        <ul>
                            <li><b>Definition and Importance:</b> A database is an organized collection of data stored electronically, designed to be easily accessed, managed, and updated. Nearly every business today utilizes databases to store information ranging from customer data to inventory, which is essential for efficient operations and strategic decision-making.</li>
                            <li><b>Database Providers:</b> Database providers offer the technology to store and manage data. Each provider may have unique strengths, such as speed, scalability, or ease of use, making some better suited for specific types of applications than others. Common choices include Oracle, SQL Server, and MySQL.</li>
                            <div className="database-icons">
                                <img src={getIconByConnectionType({ dbType: 'MSSQL' })} alt="SQL Server" title="SQL Server" />
                                <img src={getIconByConnectionType({ dbType: 'Oracle' })} alt="Oracle" title="Oracle" />
                                <img src={getIconByConnectionType({ dbType: 'MySQL' })} alt="MySQL" title="MySQL" />
                                <img src={getIconByConnectionType({ dbType: 'Postgres' })} alt="Postgres" title="Postgres" />
                                <img src={getIconByConnectionType({ dbType: 'MongoDB' })} alt="MongoDB" title="MongoDB" />
                                <img src={getIconByConnectionType({ dbType: 'DB2' })} alt="DB2" title="DB2" />
                            </div>
                            <li><b>ReportForge Integration:</b> To simplify data management across multiple platforms, ReportForge can integrate data from various database providers, allowing businesses to centralize their data analysis and reporting in one powerful tool.</li>
                        </ul>
                    </section>
                    {/* Details on Tables, Columns, and Datatypes */}
                    <section id="about-tables-columns-and-datatypes">
                        <h2>About Tables, Columns, and Datatypes</h2>
                        <ul>
                            <li><b>Spreadsheet Analogy:</b> Think of a database table like a spreadsheet with rows and columns, where each row represents a record and each column represents a field in the record. For instance, a customer database may have columns for name, address, and phone number.</li>
                            <li><b>Database Tables:</b> A table in a database holds data about a specific topic, structured in rows and columns. Normalization is a design approach used to minimize redundancy and dependency by organizing fields and table relations.</li>
                            <li><b>Columns and Datatypes:</b> Columns in a database table describe the data each element holds, with datatypes specifying the kind of data, such as text (VARCHAR), numbers (INTEGER), and dates (DATE). More complex types include BLOB for storing binary data like images.</li>
                            <li><b>Table Relationships:</b> Tables relate to one another through keys. A primary key is a unique identifier for each record in a table, while foreign keys link two tables together by referring back to a primary key in another table.</li>
                        </ul>
                    </section>
                    {/* Explanation of Joins */}
                    <section id="what-are-joins">
                        <h2>What are Joins?</h2>
                        <ul>
                            <li><b>Purpose of Joins:</b> Joins are used to combine rows from two or more tables based on a related column between them, essential for deriving meaningful information across different data segments.</li>
                            <li><b>Types of Joins:</b> There are several types of joins:
                                <ul>
                                    <li>INNER JOIN returns rows when there is a match in both tables.</li>
                                    <li>LEFT JOIN returns all rows from the left table, and the matched rows from the right table.</li>
                                    <li>RIGHT JOIN and FULL JOIN work similarly by focusing on one side or both sides respectively.</li>
                                </ul>
                            </li>
                            <li><b>Join Conditions:</b> Joins are defined by conditions that specify which columns from each table should match. ReportForge typically uses INNER joins by default, ensuring only matching data from both tables is combined.</li>
                            <li><a href="https://learnsql.com/blog/sql-joins/">Image Credit & Futher Info</a></li>
                        </ul>
                    </section>
                    {/* Using Filters, Conditionals, and Sorting */}
                    <section id="filters-conditionals-and-order-by">
                        <h2>Filters, Conditionals, and Order By</h2>
                        <ul>
                            <li><b>Using WHERE Clauses:</b> The WHERE clause is used in SQL to filter records, allowing users to specify conditions such as customer_age &gt; 30 to retrieve data that meet certain criteria.</li>
                            <li><b>Comparison Operators:</b> These operators, including equals (=), greater than (&gt;), less than (&lt;), are used in WHERE clauses to filter data based on conditions.</li>
                            <li><b>Order By:</b> Similar to sorting in a spreadsheet, the ORDER BY clause is used in SQL to sort data in ascending or descending order based on one or more columns, such as sorting by the last name or date of birth.</li>
                        </ul>
                    </section>
                    {/* Conclusion and Overview of SQL Queries */}
                    <section id="conclusion-and-queries-overview">
                        <h2>Conclusion and Queries Overview</h2>
                        <ul>
                            <li><b>Basic SQL Queries:</b> Basic SQL queries include SELECT for retrieving data, INSERT for adding new records, UPDATE for modifying existing records, and DELETE for removing records. These commands form the foundation of interacting with databases.</li>
                            <li><b>Generating Insights with SQL:</b> Through careful query design, SQL can be used to create valuable insights from data, supporting business decision-making.</li>
                            <li><b>Learning More:</b> For those interested in deepening their understanding of SQL and database management, further resources and detailed guides are available online.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DatabasesGuides;
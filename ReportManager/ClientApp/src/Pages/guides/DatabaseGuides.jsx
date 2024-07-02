import React from 'react';
import spreadsheet_example from '../../components/Images/spreadsheet_example.PNG';
import inner_join from '../../components/Images/full_join.png';
import left_outer_join from '../../components/Images/left_outer_join.png';
import full_join from '../../components/Images/full_join.png';

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
                            <li><b>Definition and Importance:</b><br/> A database is an organized collection of data stored electronically, designed to be easily accessed, managed, and updated. Nearly every business today utilizes databases to store information ranging from customer data, employee information and statistics, to inventory, which is essential for efficient operations and strategic decision-making.</li>
                            <br/>
                            <li><b>Database Providers:</b><br/> Database providers offer the technology to store and manage data. Each provider may have unique strengths, such as speed, scalability, or ease of use, making some better suited for specific types of applications than others. Common choices include Oracle, SQL Server, and MySQL.</li>
                            <div className="database-icons">
                                <img src={getIconByConnectionType({ dbType: 'MSSQL' })} alt="SQL Server" title="SQL Server" />
                                <img src={getIconByConnectionType({ dbType: 'Oracle' })} alt="Oracle" title="Oracle" />
                                <img src={getIconByConnectionType({ dbType: 'MySQL' })} alt="MySQL" title="MySQL" />
                                <img src={getIconByConnectionType({ dbType: 'Postgres' })} alt="Postgres" title="Postgres" />
                                <img src={getIconByConnectionType({ dbType: 'MongoDB' })} alt="MongoDB" title="MongoDB" />
                                <img src={getIconByConnectionType({ dbType: 'DB2' })} alt="DB2" title="DB2" />
                                <br/>
                                <i>The above are the icons for MSSQL, Oracle DB, MySQL, PostgreSQL, MongoDB, and IBM DB respectively.</i>
                            </div>
                            <br/><br/>
                            <li><b>ReportForge Integration:</b><br/> To simplify data analysis across multiple platforms, ReportForge is designed to access data from all database providers, allowing businesses to centralize their reporting in one central tool.</li>
                        </ul>
                    </section>
                    {/* Details on Tables, Columns, and Datatypes */}
                    <section id="about-tables-columns-and-datatypes">
                        <h2>About Tables, Columns, and Datatypes</h2>
                        <ul>
                            <li><b>Spreadsheet Analogy:</b><br/>One can conceptualize a database table like a spreadsheet, where each row represents a record and each column stores a specific set of data for that record. For example, a customer database may have columns for name, address, and phone number. Subsequently, each individual name, address, or phone number is a single value (field).</li>
                            <br/>
                            <img src={spreadsheet_example} /><br/><br/>
                            <i>In the above, the column names are highlighted in yellow and a single record/row is highlighted in blue. A, B and C are columns and 2-10 are the individual records.</i>
                            <br /><br/>
                            <li><b>Database Tables:</b><br />Database servers typically host multiple databases. Some databases are designed for the hosting server itself, each individual database is usually used for a single app or purpose. Databases contain several different objects: tables, views, and procedures, among other things. A single table should be self contained data without duplicating information that is already present in another table.
                                This process of ensuring data integrity and minimizing redundancy is called "normalization".</li>
                            <br/>
                            <li><b>Columns and Datatypes:</b><br /> Columns in a database table define the attributes of the data they hold, such as maximum length and specific formatting requirements. Datatypes specify the kind of data, such as text (VARCHAR), numbers (Ex. INTEGER, DECIMAL, MONEY), and dates (DATE or DATETIME). For more complex data, like images or large documents, special types such as BLOB are used to handle this information effectively.</li>
                            <br/>
                            <li><b>Table Relationships:</b><br />Tables can connect to each other using keys. A primary key is a unique identifier for each record in a table, ensuring each entry is distinct. A foreign key links two tables by referring to a primary key in one table, which helps organize related information between the two tables.</li>
                        </ul>
                    </section>
                    {/* Explanation of Joins */}
                    <section id="what-are-joins">
                        <h2>What are Joins?</h2>
                        <ul>
                            <li><b>Purpose of Joins:</b> Joins are used to combine rows from two or more tables based on a related column between them. They help us get a more complete picture by connecting pieces of information that are spread across different tables.</li>
                            <br/>
                            <li><b>Types of Joins:</b> There are several types of joins:</li>
                            <br/>
                            <ul>
                                <li><b>INNER JOIN:</b><br /> Returns rows when there is matching data in both tables based on a common column. It only includes data where there is a match in both the first and second table specified.</li>
                                <img src={inner_join} className="join-img" /><br/><br/><br/>
                                <li><b>LEFT JOIN:</b><br /> Returns all rows from the first table (left) and the matched rows from the second table (right). If there is no matching data in the second table, the result will still include the rows from the first table with empty (NULL) values for the second table's columns.</li>
                                <li><b>RIGHT JOIN:</b><br /> Similar to left join except applied on the second table in the query (right).</li>
                                <img src={left_outer_join} className="join-img"/><br/><br/>
                                <li><b>FULL JOIN:</b><br /> Returns all rows from both the first and second tables, whether there is matching data or not. Unmatched rows will have empty (NULL) values for the columns from the table without a match.</li>
                                <img src={full_join} className="join-img" /><br/><br/>
                            </ul>
                            <br/>
                            <li><b>Join Conditions:</b> Joins are defined by conditions that specify which columns from each table should match. For example, you might join a customer table and an orders table where the customer ID is the same in both tables.</li>
                        </ul>
                        <a href="https://blog.codinghorror.com/a-visual-explanation-of-sql-joins/">Image Credit & Further Info</a>
                        <br/><br/>
                    </section>
                    {/* Using Filters, Conditionals, and Sorting */}
                    <section id="filters-conditionals-and-order-by">
                        <h2>Filters, Conditionals, and Order By</h2>
                        <ul>
                            <li><b>Using WHERE Clauses:</b><br /> The WHERE clause is used in SQL to filter records, allowing users to specify conditions to include only the records needed. With WHERE clauses, you can:</li>
                            <ul>
                                <li>Filter data to focus on what matters, like certain customers or date ranges</li>
                                <li>Combine conditions with AND/OR for more precise filtering</li>
                                <li>Use comparison operators to define conditions:</li>
                                <ul>
                                    <li>Equals (=) for exact matches</li>
                                    <li>Greater than (&gt;) and less than (&lt;)</li>
                                    <li>Greater than or equal to (&gt;=) and less than or equal to (&lt;=)</li>
                                    <li>BETWEEN for a range of values</li>
                                    <li>IN to match a set of values</li>
                                </ul>
                            </ul>
                            <li><b>Order By:</b><br /> The ORDER BY clause is your sorting methodology in SQL queries. You can have multiple ORDER BY clauses, which will display the data according to the specified priority.</li>
                        </ul>
                    </section>
                    {/* Conclusion and Overview of SQL Queries */}
                    <section id="conclusion-and-queries-overview">
                        <h2>Conclusion and Queries Overview</h2>
                        <span>Basic SQL queries include SELECT for retrieving data, INSERT for adding new records, UPDATE for modifying existing records, and DELETE for removing records. These commands form the foundation of interacting with databases. Through careful query design, SQL can be used to create valuable insights from data, supporting business decision-making. For those interested in deepening their understanding of SQL and database management, further resources and detailed guides are available online.</span>
                        <br /><br />
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DatabasesGuides;
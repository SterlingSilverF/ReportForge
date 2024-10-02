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
                    <li><a href="#test-plan">Test Plan</a></li>
                </ul>
                <div style={{ flex: '3 1 75%' }}>
                    <section id="test-plan">
                        <h2>Test Plan</h2>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CapstoneMaterials;
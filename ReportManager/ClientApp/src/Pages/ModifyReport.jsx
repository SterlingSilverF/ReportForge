import React, { Component } from 'react';
import axios from 'axios';

class ModifyReport extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reportId: '',
            newReportName: '',
            newReportContent: '',
            // other state variables you may need
        };
    }

    componentDidMount() {
        // Fetch report details here if needed
    }

    handleInputChange = (e) => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    handleModifyReport = () => {
        const { reportId, newReportName, newReportContent } = this.state;

        // API call to modify the report
        axios.put('/api/Report/modify', {
            reportId,
            newReportName,
            newReportContent
        })
            .then(response => {
                console.log('Report modified:', response.data);
                // Navigate or update state as necessary
            })
            .catch(error => {
                console.error('Could not modify report:', error);
            });
    };

    render() {
        const { reportId, newReportName, newReportContent } = this.state;

        return (
            <div className="modify-report-container">
                <h2>Modify Report</h2>
                <form onSubmit={this.handleModifyReport}>
                    <div className="form-element">
                        <label>Report ID:</label>
                        <input
                            type="text"
                            name="reportId"
                            value={reportId}
                            onChange={this.handleInputChange}
                        />
                    </div>
                    <div className="form-element">
                        <label>New Report Name:</label>
                        <input
                            type="text"
                            name="newReportName"
                            value={newReportName}
                            onChange={this.handleInputChange}
                        />
                    </div>
                    <div className="form-element">
                        <label>New Report Content:</label>
                        <textarea
                            name="newReportContent"
                            value={newReportContent}
                            onChange={this.handleInputChange}
                        />
                    </div>
                    <button type="submit">Modify Report</button>
                </form>
            </div>
        );
    }
}

export default ModifyReport;
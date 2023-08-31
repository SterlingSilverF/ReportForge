import React, { Component } from 'react';
import axios from 'axios';

class GroupConnections extends Component {
    constructor(props) {
        super(props);
        this.state = {
            groupId: '',
            connections: [],
            // other state variables as needed
        };
    }

    componentDidMount() {
        // Fetch connections for the group
        axios.get(`/api/Group/${this.state.groupId}/connections`)
            .then(response => {
                this.setState({ connections: response.data });
            })
            .catch(error => {
                console.error('Could not fetch connections:', error);
            });
    }

    handleSelectConnection = (connectionId) => {
        // Handle selection or navigation logic here
    };

    render() {
        const { connections } = this.state;

        return (
            <div className="group-connections-container">
                <h2>Group Connections</h2>
                <ul>
                    {connections.map((connection, index) => (
                        <li key={index} onClick={() => this.handleSelectConnection(connection.id)}>
                            {connection.name}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}

export default GroupConnections;
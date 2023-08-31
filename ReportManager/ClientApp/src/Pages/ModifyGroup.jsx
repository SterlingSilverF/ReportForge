import React, { Component } from 'react';
import axios from 'axios';

class ModifyGroup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            groupId: '',
            newGroupName: '',
            selectedOwners: [],
            selectedMembers: [],
            // other state variables you may need
        };
    }

    componentDidMount() {
        // Fetch group details here if needed
    }

    handleInputChange = (e) => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    handleModifyGroup = () => {
        const { groupId, newGroupName, selectedOwners, selectedMembers } = this.state;

        // API call to modify the group
        axios.put('/api/Group/modify', {
            groupId,
            newGroupName,
            selectedOwners,
            selectedMembers
        })
            .then(response => {
                console.log('Group modified:', response.data);
                // Navigate or update state as necessary
            })
            .catch(error => {
                console.error('Could not modify group:', error);
            });
    };

    render() {
        const { groupId, newGroupName, selectedOwners, selectedMembers } = this.state;

        return (
            <div className="modify-group-container">
                <h2>Modify Group</h2>
                <form onSubmit={this.handleModifyGroup}>
                    <div className="form-element">
                        <label>Group ID:</label>
                        <input
                            type="text"
                            name="groupId"
                            value={groupId}
                            onChange={this.handleInputChange}
                        />
                    </div>
                    <div className="form-element">
                        <label>New Group Name:</label>
                        <input
                            type="text"
                            name="newGroupName"
                            value={newGroupName}
                            onChange={this.handleInputChange}
                        />
                    </div>
                    {/* Dual Listbox for selectedOwners and selectedMembers go here */}
                    <button type="submit">Modify Group</button>
                </form>
            </div>
        );
    }
}

export default ModifyGroup;
import React, { Component } from 'react';
import axios from 'axios';

class ModifyFolder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            folderName: '',
            newFolderName: '',
            // other state variables here
        };
    }

    componentDidMount() {
        // Fetch folder details or anything else you need
    }

    handleInputChange = (e) => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    handleModifyFolder = () => {
        const { folderName, newFolderName } = this.state;

        // API call to modify the folder
        axios.put('/api/folder/modify', { folderName, newFolderName })
            .then(response => {
                console.log('Folder modified:', response.data);
                // Navigate or update state as necessary
            })
            .catch(error => {
                console.error('Could not modify folder:', error);
            });
    };

    render() {
        const { folderName, newFolderName } = this.state;

        return (
            <div className="modify-folder-container">
                <h2>Modify Folder</h2>
                <form onSubmit={this.handleModifyFolder}>
                    <div className="form-element">
                        <label>Current Folder Name:</label>
                        <input
                            type="text"
                            name="folderName"
                            value={folderName}
                            onChange={this.handleInputChange}
                        />
                    </div>
                    <div className="form-element">
                        <label>New Folder Name:</label>
                        <input
                            type="text"
                            name="newFolderName"
                            value={newFolderName}
                            onChange={this.handleInputChange}
                        />
                    </div>
                    <button type="submit">Modify Folder</button>
                </form>
            </div>
        );
    }
}

export default ModifyFolder;
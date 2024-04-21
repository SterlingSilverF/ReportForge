import React, { createContext, useContext, useState, useCallback } from 'react';
const ConnectionFormContext = createContext();
export const useConnectionForm = () => useContext(ConnectionFormContext);

export const ConnectionFormProvider = ({ children }) => {
    const [connectionFormData, setConnectionFormData] = useState({
        id: '',
        serverName: '',
        port: '',
        dbType: 'MSSQL',
        instance: '',
        username: '',
        password: '',
        authType: '',
        ownerID: '',
        ownerType: 'Personal',
        configType: 'Server',
        schema: '',
        showConnections: 'OnlyUserOrGroup',
        existingServer: false,
        selectedServerConnection: '',
        userGroups: [],
        serverConnections: [],
        collectionCategory: '',
        friendlyName: '',
        databaseName: '',
    });

    const updateConnectionFormData = useCallback((newData) => {
        setConnectionFormData(prevFormData => ({ ...prevFormData, ...newData }));
    }, []);

    return (
        <ConnectionFormContext.Provider value={{ connectionFormData, updateConnectionFormData }}>
            {children}
        </ConnectionFormContext.Provider>
    );
};

import React, { createContext, useContext, useState, useCallback, use } from 'react';
const ConnectionFormContext = createContext();
export const useConnectionForm = () => useContext(ConnectionFormContext);

export const ConnectionFormProvider = ({ children }) => {
    const initialFormData = {
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
        friendlyName: '',
        databaseName: '',
    };

    const [connectionFormData, setConnectionFormData] = useState(initialFormData);

    const updateConnectionFormData = useCallback((newData) => {
        setConnectionFormData(prevFormData => ({ ...prevFormData, ...newData }));
    }, []);

    const clearConnectionFormData = useCallback(() => {
        setConnectionFormData(initialFormData);
    }, []);

    return (
        <ConnectionFormContext.Provider value={{ connectionFormData, updateConnectionFormData, clearConnectionFormData }}>
            {children}
        </ConnectionFormContext.Provider>
    );
};

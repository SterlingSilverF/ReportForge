import React, { createContext, useContext, useState } from 'react';

const ReportFormContext = createContext();

export const useReportForm = () => useContext(ReportFormContext);

export const ReportFormProvider = ({ children }) => {
    const [reportFormData, setReportFormData] = useState({
        reportName: '',
        reportDescription: '',
        reportType: 'personal',
        selectedGroup: null,
        selectedConnection: null,
        dbType: '',
        selectedFolder: null,
        selectedTables: [],
        selectedColumns: [],
        joinConfig: [],
        orderByConfig: []
    });

    const updateReportFormData = (newData) => {
        setReportFormData(prevFormData => ({ ...prevFormData, ...newData }));
    };

    return (
        <ReportFormContext.Provider value={{ reportFormData, updateReportFormData }}>
            {children}
        </ReportFormContext.Provider>
    );
};
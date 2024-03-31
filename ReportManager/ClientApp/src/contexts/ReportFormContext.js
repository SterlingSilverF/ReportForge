import React, { createContext, useContext, useState, useRef } from 'react';
const ReportFormContext = createContext();
export const useReportForm = () => useContext(ReportFormContext);

export const ReportFormProvider = ({ children }) => {
    const [reportFormContext, setReportFormData] = useState({
        reportName: '',
        reportDescription: '',
        reportType: 'User',
        selectedGroup: null,
        selectedConnection: null,
        dbType: '',
        selectedFolder: null,
        selectedTables: [],
        selectedColumns: [],
        joinConfig: [],
        filters: [],
        orderBys: [],
        compiledSQL: '',
        outputFormat: 'csv',
        reportFrequencyValue: 1,
        reportFrequencyType: 'months',
        reportGenerationTime: '00:00',
        emailReports: 'no',
        emailRecipients: ''
    });

    const updateReportFormData = (newData) => {
        setReportFormData(prevFormData => ({ ...prevFormData, ...newData }));
    }; 

    return (
        <ReportFormContext.Provider value={{ reportFormContext, updateReportFormData }}>
            {children}
        </ReportFormContext.Provider>
    );
};
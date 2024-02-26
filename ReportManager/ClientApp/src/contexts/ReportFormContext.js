import React, { createContext, useContext, useState, useRef } from 'react';
const ReportFormContext = createContext();
export const useReportForm = () => useContext(ReportFormContext);

export const ReportFormProvider = ({ children }) => {
    const [reportFormContext, setReportFormData] = useState({
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
        filters: [{
            id: `Filter_0`,
            table: '',
            column: '',
            condition: '',
            value: '',
            columnOptions: [],
            andOr: ''
        }],
        filterValueRefs: useRef([]),
        orderBys: [{
            id: `OrderBy_0`,
            table: '',
            column: '',
            direction: '',
            columnOptions: []
        }]
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
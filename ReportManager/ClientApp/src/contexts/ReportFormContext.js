import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ReportFormContext = createContext();
export const useReportForm = () => useContext(ReportFormContext);

const initialReportFormData = {
    reportName: '',
    reportDescription: '',
    reportType: 'Personal',
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
    reportFrequencyType: 'monthly',
    reportGenerationTime: '00:00',
    emailReports: 'no',
    emailRecipients: '',
    retentionPeriodValue: 30,
    retentionPeriodType: 'days'
};

export const ReportFormProvider = ({ children }) => {
    const [reportFormContext, setReportFormData] = useState(initialReportFormData);

    const updateReportFormData = (newData) => {
        setReportFormData(prevFormData => ({ ...prevFormData, ...newData }));
    };

    const clearReportFormData = () => {
        setReportFormData(initialReportFormData);
    };

    const location = useLocation();
    useEffect(() => {
        const exemptPaths = ['/reportform', '/reportdesigner', '/previewreport', '/reportconfig'];
        const pathDoesNotExempt = !exemptPaths.includes(location.pathname);

        if (pathDoesNotExempt) {
            clearReportFormData();
        }
    }, [location, clearReportFormData]);

    return (
        <ReportFormContext.Provider value={{ reportFormContext, updateReportFormData }}>
            {children}
        </ReportFormContext.Provider>
    );
};
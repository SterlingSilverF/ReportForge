import React, { useEffect, useState, useRef } from 'react';
import { useReportForm } from '../contexts/ReportFormContext';

const AdvancedSection = ({ rowData }) => {
    const { reportFormContext, updateReportFormData } = useReportForm();

    const handleMaxLengthChange = (columnName, maxLength) => {
        const updatedColumns = reportFormContext.selectedColumns.map(column => {
            if (column.columnName === columnName) {
                return {
                    ...column,
                    columnFormatting: {
                        ...column.columnFormatting,
                        maxLength: maxLength !== '' ? parseInt(maxLength) : null,
                    },
                };
            }
            return column;
        });

        updateReportFormData({ selectedColumns: updatedColumns });
    };

    const handleFormatChange = (columnName, format) => {
        const updatedColumns = reportFormContext.selectedColumns.map(column => {
            if (column.columnName === columnName) {
                return {
                    ...column,
                    columnFormatting: {
                        ...column.columnFormatting,
                        formatValue: format,
                    },
                };
            }
            return column;
        });

        updateReportFormData({ selectedColumns: updatedColumns });
    };

    const getFormattingOptions = dataType => {
        switch (dataType) {
            case 'number':
                return (
                    <>
                        <option value="">No Alterations</option>
                        <option value=",">Comma separator</option>
                        <option value=".">Dot separator</option>
                        <option value=" ">Space separator</option>
                    </>
                );
            case 'date':
                return (
                    <>
                        <option value="">Default</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                        <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                        <option value="YYYY-MM-DD HH:mm">YYYY-MM-DD HH:mm</option>
                    </>
                );
            default:
                return null;
        }
    };

    const getOutputSample = (columnName, maxLength, formatValue) => {
        const column = reportFormContext.selectedColumns.find(
            col => col.columnName === columnName
        );

        if (!column) return '';

        const { dataType } = column;

        // Get the value of the first row for the specified column
        const firstRowValue = rowData[0]?.[columnName];

        if (dataType === 'string') {
            if (formatValue === 'Default') {
                // If formatting is default, check max length and return the first row's value
                return firstRowValue?.slice(0, maxLength) || '';
            }
            return `Sample text`.slice(0, maxLength);
        }

        if (dataType === 'number') {
            if (formatValue === 'Default') {
                // If formatting is default, check max length and return the first row's value
                const formattedNumber = firstRowValue?.toString().slice(0, maxLength) || '';
                return formattedNumber;
            }
            const number = firstRowValue || 1234567.89;
            const formattedNumber = formatValue
                ? number.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    useGrouping: formatValue !== '',
                    groupingSeparator: formatValue,
                })
                : number;
            return formattedNumber;
        }

        if (dataType === 'date') {
            if (formatValue === '' || formatValue === 'Default') {
                // If formatting is default or empty, return the first row's value as is
                return firstRowValue || '';
            }
            const date = new Date(firstRowValue);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');

            switch (formatValue) {
                case 'YYYY-MM-DD':
                    return `${year}-${month}-${day}`;
                case 'MM-DD-YYYY':
                    return `${month}-${day}-${year}`;
                case 'DD-MM-YYYY':
                    return `${day}-${month}-${year}`;
                case 'YYYY-MM-DD HH:mm':
                    return `${year}-${month}-${day} ${hours}:${minutes}`;
                default:
                    return firstRowValue || '';
            }
        }

        return '';
    };

    return (
        <div>
            <h4>Advanced Column Settings (Gamma)</h4>
            <br/>
            <table className="advanced-table">
                <thead>
                    <tr>
                        <th>Column Name</th>
                        <th>Max Length</th>
                        <th>Format</th>
                        <th>Output Sample</th>
                    </tr>
                </thead>
                <tbody>
                    {reportFormContext.selectedColumns.map(column => (
                        <tr key={column.columnName}>
                            <td>{column.columnName}</td>
                            <td>
                                {column.dataType !== 'date' && (
                                    <input
                                        type="number"
                                        className="input-style-number"
                                        placeholder="None"
                                        value={column.columnFormatting?.maxLength || ''}
                                        onChange={e => handleMaxLengthChange(column.columnName, e.target.value)}
                                    />
                                )}
                            </td>
                            <td>
                                <select
                                className="standard-select"
                                    value={column.columnFormatting?.formatValue || ''}
                                    onChange={e =>
                                        handleFormatChange(column.columnName, e.target.value)
                                    }
                                >
                                    {getFormattingOptions(column.dataType)}
                                </select>
                            </td>
                            <td>
                                {getOutputSample(
                                    column.columnName,
                                    column.columnFormatting?.maxLength,
                                    column.columnFormatting?.formatValue
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdvancedSection;
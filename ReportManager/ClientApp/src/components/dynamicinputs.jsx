import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useReportForm } from '../contexts/ReportFormContext';

const DynamicInputs = ({ fetchTableColumns, inputValues, setInputValues }) => {
    const MAX_FILTERS = 6;
    const MAX_ORDERBYS = 5;
    const { reportFormContext, updateReportFormData } = useReportForm();
    const [filterId, setFilterId] = useState(1);
    const [orderById, setOrderById] = useState(1);

    const addNewFilter = () => {
        if (reportFormContext.filters.length < MAX_FILTERS) {
            const newFilter = {
                id: `Filter_${filterId}`,
                table: '',
                column: '',
                condition: '',
                value: '',
                columnOptions: [],
                andOr: reportFormContext.filters.length > 0 ? 'AND' : ''
            };

            updateReportFormData({
                filters: [...reportFormContext.filters, newFilter]
            });

            setInputValues(prevState => ({
                ...prevState,
                [`filter-value-${newFilter.id}`]: ''
            }));

            setFilterId(filterId + 1);
        }
    };

    const addNewOrderBy = () => {
        if (reportFormContext.orderBys.length < MAX_ORDERBYS) {
            const newOrderBy = {
                id: `OrderBy_${orderById}`,
                table: '',
                column: '',
                direction: '',
                columnOptions: []
            };
            updateReportFormData({
                orderBys: [...reportFormContext.orderBys, newOrderBy]
            });
            setOrderById(orderById + 1);
        }
    };

    const updateColumnOptions = async (id, isFilter, tableName) => {
        const columns = await fetchTableColumns(tableName);
        if (isFilter) {
            const updatedFilters = reportFormContext.filters.map(filter =>
                filter.id === id ? { ...filter, table: tableName, columnOptions: columns } : filter
            );
            updateReportFormData({
                filters: updatedFilters
            });
        } else {
            const filteredColumns = columns.filter(columnName =>
                reportFormContext.selectedColumns.some(sc => sc.table === tableName && sc.columnName === columnName)
            );
            const updatedOrderBys = reportFormContext.orderBys.map(orderBy =>
                orderBy.id === id ? { ...orderBy, table: tableName, columnOptions: filteredColumns } : orderBy
            );
            updateReportFormData({
                orderBys: updatedOrderBys
            });
        }
    };

    const handleValueChange = (id, value) => {
        setInputValues(prevState => ({
            ...prevState,
            [id]: value
        }));
    };

    const removeFilter = (id) => {
        const updatedFilters = reportFormContext.filters.filter(filter => filter.id !== id);
        updateReportFormData({ filters: updatedFilters });

        setInputValues(prevState => {
            const updatedInputValues = { ...prevState };
            delete updatedInputValues[`filter-value-${id}`];
            return updatedInputValues;
        });
    };

    const removeOrderBy = (id) => {
        const updatedOrderBys = reportFormContext.orderBys.filter(orderBy => orderBy.id !== id);
        updateReportFormData({
            orderBys: updatedOrderBys
        });
    };

    const handleFilterChange = async (id, field, value) => {
        const updatedFilters = reportFormContext.filters.map(filter => filter.id === id ? { ...filter, [field]: value } : filter);
        updateReportFormData({
            filters: updatedFilters
        });
        if (field === 'table') {
            await updateColumnOptions(id, true, value);
        }
    };

    const handleOrderByChange = async (id, field, value) => {
        const updatedOrderBys = reportFormContext.orderBys.map(orderBy => orderBy.id === id ? { ...orderBy, [field]: value } : orderBy);
        updateReportFormData({
            orderBys: updatedOrderBys
        });
        if (field === 'table') {
            await updateColumnOptions(id, false, value);
        }
    };

    const TableSelect = ({ id, value, onChange, options }) => (
        <select id={id} value={value} onChange={e => onChange(e.target.value)}>
            <option value="">--Select a Table--</option>
            {options.map((option, index) => (
                <option key={index} value={option}>{option}</option>
            ))}
        </select>
    );

    const ColumnSelect = ({ id, value, onChange, options }) => (
        <select id={id} value={value} onChange={e => onChange(e.target.value)}>
            <option value="">--Select a Column--</option>
            {options.map((option, index) => (
                <option key={index} value={option}>{option}</option>
            ))}
        </select>
    );

    const ConditionSelect = ({ id, value, onChange }) => (
        <select id={id} value={value} onChange={e => onChange(e.target.value)}>
            <option value="">--Select a Condition--</option>
            <option value="=">Equals</option>
            <option value="!=">Not Equal To</option>
            <option value=">">Greater Than</option>
            <option value=">=">Greater Than or Equal To</option>
            <option value="<">Less Than</option>
            <option value="<=">Less Than or Equal To</option>
            {/*<option value="Between">Between</option>
            <option value="In">Contained in List</option>*/}
        </select>
    );

    const AndOrSelect = ({ value, onChange }) => (
        <select value={value} onChange={e => onChange(e.target.value)}>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
        </select>
    );

    const OrderBySelect = ({ id, value, onChange }) => (
        <select id={id} value={value} onChange={e => onChange(e.target.value)}>
            <option value="">--Select a Sort--</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
        </select>
    );

    const calculateSpacerHeight = (itemCount) => {
        const baseHeight = 215;
        const minHeight = 40;
        const dynamicHeight = Math.max(baseHeight - (itemCount * 24), minHeight);
        return `${dynamicHeight}px`;
    };

    return (
        <div className="stagger">
            <div>
                <h4>Filters and Conditions</h4>
                <div className="explanation-box">
                    <p>What kind of data do you want to include or exclude?</p>
                    <a href="/guides/conditionals">Read More</a>
                </div>
                <button className="report-designer-button" onClick={addNewFilter}>Add</button>
                <button className="report-designer-button" onClick={() => reportFormContext.filters.length && removeFilter(reportFormContext.filters[reportFormContext.filters.length - 1].id)}>Remove</button>
                <div style={{ height: '40px' }}></div>
                <h4>Order By</h4>
                <div className="explanation-box eb-mini">
                    <p>Display what kind of data first?</p>
                </div>
                <button className="report-designer-button" onClick={addNewOrderBy}>Add</button>
                <button className="report-designer-button" onClick={() => reportFormContext.orderBys.length && removeOrderBy(reportFormContext.orderBys[reportFormContext.orderBys.length - 1].id)}>Remove</button>
            </div>

            <div>
                <label>Select Table</label>
                {reportFormContext.filters.map((filter) => (
                    <TableSelect
                        key={filter.id}
                        value={filter.table}
                        onChange={(value) => handleFilterChange(filter.id, 'table', value)}
                        options={reportFormContext.selectedTables}
                    />
                ))}
                <div style={{ height: calculateSpacerHeight(reportFormContext.filters.length) }}></div>
                {reportFormContext.orderBys.map((orderBy) => (
                    <TableSelect
                        key={orderBy.id}
                        value={orderBy.table}
                        onChange={(value) => handleOrderByChange(orderBy.id, 'table', value)}
                        options={reportFormContext.selectedTables}
                    />
                ))}
            </div>

            <div>
                <label>Select Column</label>
                {reportFormContext.filters.map((filter) => (
                    <ColumnSelect
                        key={filter.id}
                        value={filter.column}
                        onChange={(value) => handleFilterChange(filter.id, 'column', value)}
                        options={filter.columnOptions}
                    />
                ))}
                <div style={{ height: calculateSpacerHeight(reportFormContext.filters.length) }}></div>
                {reportFormContext.orderBys.map((orderBy) => (
                    <ColumnSelect
                        key={orderBy.id}
                        value={orderBy.column}
                        onChange={(value) => handleOrderByChange(orderBy.id, 'column', value)}
                        options={orderBy.columnOptions}
                    />
                ))}
            </div>

            <div>
                <label>Condition</label>
                {reportFormContext.filters.map((filter) => (
                    <ConditionSelect
                        key={filter.id}
                        value={filter.condition}
                        onChange={(value) => handleFilterChange(filter.id, 'condition', value)}
                    />
                ))}
                <div style={{ height: calculateSpacerHeight(reportFormContext.filters.length) }}></div>
                {reportFormContext.orderBys.map((orderBy) => (
                    <OrderBySelect
                        key={orderBy.id}
                        value={orderBy.direction}
                        onChange={(value) => handleOrderByChange(orderBy.id, 'direction', value)}
                        options={[{ label: 'Ascending', value: 'asc' }, { label: 'Descending', value: 'desc' }]}
                    />
                ))}
            </div>
            <div>
                <div>
                    <label>Value</label>
                    {Object.entries(inputValues).map(([id, value]) => (
                        <div key={id}>
                            <input
                                type="text"
                                value={value}
                                className="input-style-short"
                                onChange={(e) => handleValueChange(id, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {reportFormContext.filters.length > 1 ? (
                <div>
                    <label>Operator</label>
                    {reportFormContext.filters.map((filter, index) => (
                        index < reportFormContext.filters.length - 1 && (
                            <AndOrSelect
                                key={filter.id}
                                value={filter.andOr}
                                onChange={(value) => handleFilterChange(filter.id, 'andOr', value)}
                            />
                        )
                    ))}
                </div>
            ) : (
                <div style={{ width: "50px" }}></div>
            )}
        </div>
    );
};

export default DynamicInputs;
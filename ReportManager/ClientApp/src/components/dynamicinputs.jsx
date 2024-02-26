import React, { useState, useEffect, useRef } from 'react';
import { useReportForm } from '../contexts/ReportFormContext';

const DynamicInputs = ({ fetchTableColumns }) => {
    const MAX_FILTERS = 6;
    const MAX_ORDERBYS = 5;
    const filterValueRefs = useRef([]);

    const { reportFormContext } = useReportForm();
    const [filters, setFilters] = useState([{
        id: `Filter_0`,
        table: '',
        column: '',
        condition: '',
        value: '',
        columnOptions: [],
        andOr: ''
    }]);
    const [orderBys, setOrderBys] = useState([{
        id: `OrderBy_0`,
        table: '',
        column: '',
        direction: '',
        columnOptions: []
    }]);
    const [filterId, setFilterId] = useState(1);
    const [orderById, setOrderById] = useState(1);
    useEffect(() => {
        filterValueRefs.current = filters.map((_, i) => filterValueRefs.current[i] || React.createRef());
    }, [filters]);

    const addNewFilter = () => {
        if (filters.length < MAX_FILTERS) {
            const newFilter = {
                id: `Filter_${filterId}`,
                table: '',
                column: '',
                condition: '',
                value: '',
                columnOptions: [],
                andOr: filters.length > 0 ? 'AND' : ''
            };
            setFilters([...filters, newFilter]);
            setFilterId(filterId + 1);
        }
    };

    const addNewOrderBy = () => {
        if (orderBys.length < MAX_ORDERBYS) {
            const newOrderBy = {
                id: `OrderBy_${orderById}`,
                table: '',
                column: '',
                direction: '',
                columnOptions: []
            };
            setOrderBys([...orderBys, newOrderBy]);
            setOrderById(orderById + 1);
        }
    };

    const updateColumnOptions = async (id, isFilter, tableName) => {
        const columns = await fetchTableColumns(tableName);
        if (isFilter) {
            setFilters(currentFilters => currentFilters.map(filter =>
                filter.id === id ? { ...filter, columnOptions: columns } : filter
            ));
        } else {
            const selectedColumns = reportFormContext.selectedColumns;
            const filteredColumns = columns.filter(column => selectedColumns.includes(column));
            setOrderBys(currentOrderBys => currentOrderBys.map(orderBy =>
                orderBy.id === id ? { ...orderBy, columnOptions: filteredColumns } : orderBy
            ));
        }
    };

    const removeFilter = (id) => {
        setFilters(filters.filter(filter => filter.id !== id));
    };

    const removeOrderBy = (id) => {
        setOrderBys(orderBys.filter(orderBy => orderBy.id !== id));
    };

    const handleFilterChange = async (id, field, value) => {
        const updatedFilters = filters.map(filter => filter.id === id ? { ...filter, [field]: value } : filter);
        setFilters(updatedFilters);
        if (field === 'table') {
            await updateColumnOptions(id, true, value);
        }
    };

    const handleOrderByChange = async (id, field, value) => {
        const updatedOrderBys = orderBys.map(orderBy => orderBy.id === id ? { ...orderBy, [field]: value } : orderBy);
        setOrderBys(updatedOrderBys);
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

    const ValueInput = React.forwardRef(({ id }, ref) => (
        <input id={id} type="text" ref={ref} className="input-style-short" />
    ));

    const AndOrSelect = ({ value, onChange }) => (
        <select value={value} onChange={e => onChange(e.target.value)}>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
        </select>
    );

    const OrderBySelect = ({ id, value, onChange }) => (
        <select id={id} value={value} onChange={e => onChange(e.target.value)}>
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

    /*
    const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    const filterValues = filterValueRefs.current.map(ref => ref.current.value);
    const orderByValues = orderByValueRefs.current.map(ref => ref.current.value);

    const formData = {
        filters: filters.map((filter, index) => ({ ...filter, value: filterValues[index] })),
        orderBys: orderBys.map((orderBy, index) => ({ ...orderBy, value: orderByValues[index] })),
    };

    console.log(formData); // Or handle the data as needed
    };
    */

    return (
        <div className="stagger">
            <div>
                <h4>Filters and Conditions</h4>
                <div className="explanation-box">
                    <p>What kind of data do you want to include or exclude?</p>
                    <a href="/guides/conditionals">Read More</a>
                </div>
                <button className="report-designer-button" onClick={addNewFilter}>Add</button>
                <button className="report-designer-button" onClick={() => filters.length && removeFilter(filters[filters.length - 1].id)}>Remove</button>
                <div style={{ height: '40px' }}></div>
                <h4>Order By</h4>
                <div className="explanation-box eb-mini">
                    <p>Display what kind of data first?</p>
                </div>
                <button className="report-designer-button" onClick={addNewOrderBy}>Add</button>
                <button className="report-designer-button" onClick={() => orderBys.length && removeOrderBy(orderBys[orderBys.length - 1].id)}>Remove</button>
            </div>

            <div>
                <label>Select Table</label>
                {filters.map((filter) => (
                    <TableSelect
                        key={filter.id}
                        value={filter.table}
                        onChange={(value) => handleFilterChange(filter.id, 'table', value)}
                        options={reportFormContext.selectedTables}
                    />
                ))}
                <div style={{ height: calculateSpacerHeight(filters.length) }}></div>
                {orderBys.map((orderBy) => (
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
                {filters.map((filter) => (
                    <ColumnSelect
                        key={filter.id}
                        value={filter.column}
                        onChange={(value) => handleFilterChange(filter.id, 'column', value)}
                        options={filter.columnOptions}
                    />
                ))}
                <div style={{ height: calculateSpacerHeight(filters.length) }}></div>
                {orderBys.map((orderBy) => (
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
                {filters.map((filter) => (
                    <ConditionSelect
                        key={filter.id}
                        value={filter.condition}
                        onChange={(value) => handleFilterChange(filter.id, 'condition', value)}
                    />
                ))}
                <div style={{ height: calculateSpacerHeight(filters.length) }}></div>
                {orderBys.map((orderBy) => (
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
                    {filters.map((filter, index) => (
                        <div key={filter.id}>
                            <ValueInput
                                id={`filter-value-${filter.id}`}
                                ref={filterValueRefs.current[index]}/>
                        </div>
                    ))}
                </div>
            </div>
            {filters.length > 1 ? (
                <div>
                    <label>Operator</label>
                    {filters.map((filter, index) => (
                        index < filters.length - 1 && (
                            <AndOrSelect
                                key={filter.id}
                                value={filter.andOr}
                                onChange={(value) => handleFilterChange(filter.id, 'andOr', value)}
                            />
                        )
                    ))}
                </div>
            ) : (
                <div style={{ width: "50px"}}></div>
            )}
        </div>
    );
};

export default DynamicInputs;
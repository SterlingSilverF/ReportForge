import React from 'react';
import DOMPurify from 'dompurify';

const FilterValueInput = ({ dataType, value, onChange }) => {
    console.log('Data Type:', dataType);
    const handleChange = (event) => {
        const sanitizedValue = DOMPurify.sanitize(event.target.value);
        onChange(sanitizedValue);
    };

    switch (dataType) {
        case 'number':
            return (
                <input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    className="input-style-short"
                />
            );
        case 'date':
            return (
                <input
                    type="date"
                    value={value}
                    onChange={handleChange}
                    className="input-style-short"
                />
            );
        default:
            return (
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    className="input-style-short"
                />
            );
    }
};

export default FilterValueInput;
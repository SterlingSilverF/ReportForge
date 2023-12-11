import React, { useEffect, useState } from 'react';
import MessageDisplay from './MessageDisplay';

const BaseForm = ({ initialData, isEditMode, onSubmit, onCustomInputChange, children }) => {
    const [formData, setFormData] = useState(initialData || {});
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (onCustomInputChange) {
            onCustomInputChange(name, value);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
            setIsSuccess(true);
            setMessage('Operation successful');
        } catch (error) {
            setIsSuccess(false);
            setMessage('An error occurred');
        }
    };

    const handleDelete = async () => {
        const itemName = document.getElementById(deleteIdentifier)?.innerText || "this item";
        const confirmDelete = window.confirm(`Are you sure you want to delete ${itemName}?`);

        if (confirmDelete) {
            setIsDeleting(true);
            try {
                await onDelete();
                alert('Deletion successful.');
                navigate('/dashboard');
            } catch (error) {
                alert('Deletion failed.');
                setIsDeleting(false);
            }
        }
    };

    return (
        <form onSubmit={handleFormSubmit}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        onChange: handleChange,
                        value: formData[child.props.name] || '',
                        disabled: isEditMode && child.props.disableOnEdit,
                    });
                }
                return child;
            })}
            <button type="submit" className="btn-three">{isEditMode ? 'Update' : 'Save'}</button>
            {isEditMode && (
                <button type="button" onClick={handleDelete} disabled={isDeleting} className="btn-three">
                    Delete
                </button>
            )}
            {message && <MessageDisplay message={message} isSuccess={isSuccess} />}
        </form>
    );
};

export default BaseForm;
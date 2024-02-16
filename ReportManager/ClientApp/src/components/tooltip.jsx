import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';

const TooltipIcon = ({ formName, fieldName }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleIconClick = () => {
        setShowTooltip(!showTooltip);
    };

    return (
        <div className="tool-tip-container no-break">
            <FontAwesomeIcon
                className="tool-tip-icon"
                icon={faCircleQuestion}
                size="1x"
                onClick={handleIconClick}
            />
            {showTooltip && (
                <div className="tool-tip-message">
                    {`Tooltip for ${fieldName} in the ${formName} form.`}
                </div>
            )}
        </div>
    );
};

export default TooltipIcon;
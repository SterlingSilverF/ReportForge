const MessageDisplay = ({ message, isSuccess }) => (
    <p className={isSuccess ? 'success-message' : 'error-message'}>{message}</p>
);
export default MessageDisplay;
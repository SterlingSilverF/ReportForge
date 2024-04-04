import loadingGif from '../components/Images/loading.gif';

function LoadingComponent({ isLoading, message }) {
    return (
        <div>
            {isLoading && <img style={{ width: '40px', height: '40px' }} src={loadingGif} alt="Loading" />}
            {message && <i>{message}</i>}
        </div>
    );
}

export default LoadingComponent;
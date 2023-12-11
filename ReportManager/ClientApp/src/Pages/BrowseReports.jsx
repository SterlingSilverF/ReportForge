import { useNavigate, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faPeopleRoof } from '@fortawesome/free-solid-svg-icons';

const BrowseReports = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const decoded = jwt_decode(token);
    const userId = decoded.UserId;

    return (
        <div className="main">
        <div className="left-border"></div>
            <h1>Browse Reports By</h1>
            <div>
                <div className="report-option">
                    <FontAwesomeIcon
                        className="report-icon"
                        icon={faFolder}
                        size="10x"
                        onClick={() => navigate(`/reports?isPersonal=true`)}
                    />
                    <label className="report-label">Personal Reports</label>
                </div>
                <div className="report-option">
                    <FontAwesomeIcon
                        className="report-icon"
                        icon={faPeopleRoof}
                        size="10x"
                        onClick={() => navigate(`/reports?isPersonal=false`)}
                    />
                    <label className="report-label">Group Reports</label>
                </div>
            </div>
            <div className="right-border"></div>
        </div>
    );
};

export default BrowseReports;
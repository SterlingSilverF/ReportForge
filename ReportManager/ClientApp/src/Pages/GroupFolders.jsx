// ... (Imports remain the same)

const GroupFolders = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const groupId = searchParams.get("groupId");

    const [folders, setFolders] = useState([]); // Replace with your actual API call

    useEffect(() => {
        // Add a default folder named after the group
        const defaultFolder = { id: groupId, name: `Default Folder for ${groupId}` };

        // Mock data for folders
        setFolders([
            defaultFolder,
            { id: 1, name: "Folder 1" },
            { id: 2, name: "Folder 2" },
            // Add more folders here
        ]);
    }, [groupId]);

    return (
        <div className="dashboard-container">
            <div className="options-section">
                <div className="header">Folders in {groupId}</div>
                {folders.map((folder, index) => (
                    <div key={index}>
                        <div className="image-label-pair">
                            <FontAwesomeIcon
                                icon={faFolder}
                                size="3x"
                                className="folder"
                                onClick={() => navigate(`/GroupFolders?folderId=${folder.id}`)}
                            />
                            <label className="rpf-red">{folder.name}</label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GroupFolders;
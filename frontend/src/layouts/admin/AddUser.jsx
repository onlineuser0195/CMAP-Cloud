import { useState, useEffect } from "react";
import '../../styles/layouts/admin/AddUser.css';
import { USER_ROLES } from "../../constants/constants";
import { adminAPI, systemAPI } from "../../api/api";
import AlertModal from "../../components/modal/alertModel";
import useAuth from "../../hooks/AuthContext";

const AddUser = () => {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "",
        location: "",
        system_id: ""
    });
    const { isLoggedIn, system, mappedRole } = useAuth();

    const [systems, setSystems] = useState([]);
    const [systemRoles, setSystemRoles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [siteLocations, setSiteLocations] = useState([]);

    const isGlobalAdmin = mappedRole === USER_ROLES.GLOBAL_ADMIN;
    const isLocalAdmin = mappedRole === USER_ROLES.LOCAL_ADMIN;

    useEffect(() => {
        const checkAuth = async () => {
            await isLoggedIn([USER_ROLES.GLOBAL_ADMIN, USER_ROLES.LOCAL_ADMIN]);
            if (isGlobalAdmin) {
                const allSystems = await systemAPI.getAllSystems();
                setSystems([{ name: "CMAP", system_id: 0 }, ...allSystems]);
            } else if (isLocalAdmin) {
                // console.log('IN LOCAL ADMIN',system)
                const res = await systemAPI.getSystemDetails(system);
                // console.log(res.data.roles);
                setSystemRoles(res.data.roles || []);
                setFormData(prev => ({ ...prev, system_id: Number(system) })); // default system_id
            }
        };
        const fetchSiteLocation = async () => {
            const locations = await adminAPI.getSiteLocations();
            setSiteLocations(locations);
        };

        checkAuth();
        fetchSiteLocation();
    }, [isLoggedIn,isGlobalAdmin, isLocalAdmin, system]);

    useEffect(() => {
        // Only GLOBAL_ADMIN selects system — fetch roles for selected system
        if (isGlobalAdmin && formData.system_id && parseInt(formData.system_id) !== 0) {
            const selected = systems.find(sys => sys.system_id === parseInt(formData.system_id));
            if (selected) setSystemRoles(selected.roles || []);
        } else if (parseInt(formData.system_id) === 0) {
            setSystemRoles([
                { mappedRole: USER_ROLES.GLOBAL_ADMIN, displayName: "Global Admin" }
            ]);
        }
    }, [formData.system_id, isGlobalAdmin, systems]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await adminAPI.addUser(formData);
            setFormData({ first_name: "", last_name: "", email: "", password: "", role: "", location: "", system_id: ""});            
            setShowAlertModal(true);
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    const closeModal = () => {
        setShowAlertModal(false); // Close the modal
    };

    const availableRoles = systemRoles.filter(role =>
        (isLocalAdmin || role.mappedRole === USER_ROLES.LOCAL_ADMIN || role.mappedRole === USER_ROLES.GLOBAL_ADMIN)
    );

    return (
        <div className="add-users">
            <div className="admin-form-container">
                <form onSubmit={handleSubmit} className="add-user-form">
                    <p>New User Registration</p>
                    <div className="add-user-form-group">
                        <label>First Name:</label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="add-user-form-group">
                        <label>Last Name:</label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="add-user-form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="add-user-form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    {isGlobalAdmin && (
                        <div className="add-user-form-group">
                            <label>System:</label>
                            <select
                                name="system_id"
                                value={formData.system_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select a system</option>
                                {systems.map(sys => (
                                    <option key={sys.system_id} value={sys.system_id}>
                                        {sys.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="add-user-form-group">
                        <label>Role:</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select a role</option>
                            {availableRoles.map(role => (
                                <option key={role.displayName} value={role.displayName}>
                                    {role.displayName}
                                </option>
                            ))}
                        </select>
                    </div>
                    {formData.role === USER_ROLES.CONFIRMATION_USER && (
                         <div className="add-user-form-group">
                             <label>Location:</label>
                             <select
                                 name="location"
                                 value={formData.location}
                                 onChange={handleInputChange}
                                 required
                             >
                                 <option value="">Select a location</option>
                                 {siteLocations.map(location => (
                                    <option key={location} value={location}>
                                        {location}
                                    </option>
                                 ))}
                             </select>
                         </div>
                     )}
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <button type="submit" className="add-user-submit-button">Submit</button>
                </form>
            </div>

            <AlertModal
                content="User added successfully"
                show={showAlertModal}
                handleClose={closeModal}
            />
        </div>
    );
};

export default AddUser;
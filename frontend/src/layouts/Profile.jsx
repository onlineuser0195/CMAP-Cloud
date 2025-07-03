import React, { useEffect, useState } from 'react';
import '../styles/layouts/Profile.css';
import { USER_ROLES } from '../constants/constants';
import AlertModal from '../components/modal/alertModel';
import { adminAPI, systemAPI } from '../api/api';
import useAuth from '../hooks/AuthContext';
import { useParams } from 'react-router-dom';
import { formatUserRole } from '../utils/util';
 
const Profile = () => {
    const { userId } = useParams();
    const { isLoggedIn, system: currentSystem, mappedRole } = useAuth();

    const isGlobalAdmin = mappedRole === USER_ROLES.GLOBAL_ADMIN;
    const isLocalAdmin  = mappedRole === USER_ROLES.LOCAL_ADMIN;

    const [user, setUser] = useState({});
    const [systems, setSystems] = useState([]);
    const [systemRoles, setSystemRoles] = useState([]);
    const [siteLocations, setSiteLocations] = useState([]);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name:  "",
        email:      "",
        password:   "",
        role:       "",
        location:   "",
        system_id:  ""
    });
    const [errorMessage, setErrorMessage]   = useState('');
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [isEditing, setIsEditing]         = useState(false);
 
    // 1) load user + siteLocations + systems/roles based on your Admin type
    useEffect(() => {
        const fetchData = async () => {
            try {
                await isLoggedIn([USER_ROLES.GLOBAL_ADMIN, USER_ROLES.LOCAL_ADMIN]);
                const { user: userRecord } = await adminAPI.getUser(userId);
                setUser(userRecord);

                const locations = await adminAPI.getSiteLocations();
                setSiteLocations(locations);

                // seed the form with user data + their system
                setFormData({
                    first_name: userRecord.first_name || "",
                    last_name:  userRecord.last_name  || "",
                    email:      userRecord.email      || "",
                    password:   "",  // always blank
                    role:       userRecord.role       || "",
                    location:   userRecord.location   || "",
                    system_id:  userRecord.system_id != null
                                  ? String(userRecord.system_id)
                                  : ""
                });

                if (isGlobalAdmin) {
                    // global admin sees ALL systems
                    const allSystems = await systemAPI.getAllSystems();
                    setSystems([{ name: "CMAP", system_id: 0 }, ...allSystems]);

                    // pre‐load roles for this user's system_id
                    const sid = userRecord.system_id;
                    if (sid === 0) {
                        setSystemRoles([
                          { mappedRole: USER_ROLES.GLOBAL_ADMIN, displayName: "Global Admin" }
                        ]);
                    } else {
                        const sys = allSystems.find(s => s.system_id === sid);
                        setSystemRoles(sys?.roles || []);
                    }
                }
                else if (isLocalAdmin) {
                    // local admin: only their own system’s roles
                    const res = await systemAPI.getSystemDetails(currentSystem);
                    setSystemRoles(res.data.roles || []);
                }
            } catch (err) {
                setErrorMessage('Failed to load user data');
            }
        };
        fetchData();
    }, [userId, isLoggedIn, isGlobalAdmin, isLocalAdmin, currentSystem]);
 
    // 2) if a GLOBAL_ADMIN switches the system selector, reload roles
    useEffect(() => {
        if (!isGlobalAdmin) return;
        const sid = parseInt(formData.system_id, 10);
        if (isNaN(sid)) return;
        if (sid === 0) {
            setSystemRoles([
              { mappedRole: USER_ROLES.GLOBAL_ADMIN, displayName: "Global Admin" }
            ]);
        } else {
            const sys = systems.find(s => s.system_id === sid);
            setSystemRoles(sys?.roles || []);
        }
    }, [formData.system_id, isGlobalAdmin, systems]);
 
    // 3) filter what roles you’re allowed to assign
    const availableRoles = systemRoles.filter(role =>
        isLocalAdmin
            ? true   // local admin can pick any role from their system
            : true   // global admin can pick any role for the selected system
    );
 
    const handleInputChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
 
    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const updateData = {
                first_name: formData.first_name,
                last_name:  formData.last_name,
                email:      formData.email,
                role:       formData.role,
                location:   formData.location
            };
            if (formData.password) {
                updateData.password = formData.password;
            }
            // let GLOBAL_ADMIN reassign system
            if (isGlobalAdmin && formData.system_id !== "") {
                updateData.system_id = parseInt(formData.system_id, 10);
            }
            const { user: updated } = await adminAPI.updateUser(user._id, updateData);
            setUser(updated);
            setIsEditing(false);
            setShowAlertModal(true);
            setErrorMessage('');
        } catch (err) {
            setErrorMessage(err.message || 'Failed to update profile');
        }
    };
 
    const toggleEdit = e => {
        e.preventDefault();
        if (isEditing) {
            // cancel → reset to original user
            setFormData({
                first_name: user.first_name || "",
                last_name:  user.last_name  || "",
                email:      user.email      || "",
                password:   "",
                role:       user.role       || "",
                location:   user.location   || "",
                system_id:  user.system_id != null
                              ? String(user.system_id)
                              : ""
            });
        }
        setIsEditing(!isEditing);
    };
 
    const closeModal = () => setShowAlertModal(false);
 
    return (
        <div className="edit-profile">
            <h1 className="mb-4 text-center">Edit Profile</h1>
            <div className="profile-container">
                <form onSubmit={handleSubmit} className="edit-profile-form">
                    <p>Update Account Information</p>

                    {/* First/Last/Email */}
                    <div className="edit-profile-form-group">
                        <label>First Name:</label>
                        {isEditing
                            ? <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                required
                              />
                            : <div className="profile-field-value">{user.first_name}</div>
                        }
                    </div>
                    <div className="edit-profile-form-group">
                        <label>Last Name:</label>
                        {isEditing
                            ? <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                required
                              />
                            : <div className="profile-field-value">{user.last_name}</div>
                        }
                    </div>
                    <div className="edit-profile-form-group">
                        <label>Email:</label>
                        {isEditing
                            ? <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                              />
                            : <div className="profile-field-value">{user.email}</div>
                        }
                    </div>

                    {/* Password (only when editing) */}
                    {isEditing && (
                        <div className="edit-profile-form-group">
                            <label>Password (leave blank to keep current):</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter new password"
                            />
                        </div>
                    )}

                    {/* System selector for GLOBAL_ADMIN */}
                    {isGlobalAdmin && (
                        <div className="edit-profile-form-group">
                            <label>System:</label>
                            {isEditing
                                ? <select
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
                                : <div className="profile-field-value">
                                    {systems.find(s => s.system_id === user.system_id)?.name
                                      || 'CMAP'}
                                  </div>
                            }
                        </div>
                    )}

                    {/* Role selector (dynamic) */}
                    <div className="edit-profile-form-group">
                        <label>Role:</label>
                        {isEditing
                            ? <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                required
                              >
                                <option value="">Select a role</option>
                                {availableRoles.map(r => (
                                    <option key={r.mappedRole} value={r.displayName}>
                                        {r.displayName}
                                    </option>
                                ))}
                              </select>
                            : <div className="profile-field-value">
                                {formatUserRole(user.role)}
                              </div>
                        }
                    </div>

                    {/* Location for CONFIRMATION_USER */}
                    {isEditing && formData.role === 'Confirmation User' && (
                        <div className="edit-profile-form-group">
                            <label>Location:</label>
                            <select
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select a location</option>
                                {siteLocations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {errorMessage && <p className="error-message">{errorMessage}</p>}

                    <div className="profile-actions">
                        {isEditing
                            ? <>
                                <button type="submit" className="profile-save-button">
                                  Save Changes
                                </button>
                                <button
                                  type="button"
                                  className="profile-cancel-button"
                                  onClick={toggleEdit}
                                >
                                  Cancel
                                </button>
                              </>
                            : <button
                                type="button"
                                className="profile-edit-button"
                                onClick={toggleEdit}
                              >
                                Edit Profile
                              </button>
                        }
                    </div>
                </form>
            </div>

            <AlertModal
                content="Account information updated successfully"
                show={showAlertModal}
                handleClose={closeModal}
            />
        </div>
    );
};
 
export default Profile;

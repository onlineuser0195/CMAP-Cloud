import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/layouts/admin/ManageUsers.css';
import useAuth from "../../hooks/AuthContext";
import { USER_ROLES } from "../../constants/constants";
import { adminAPI, systemAPI } from "../../api/api";
import { formatUserRole } from "../../utils/util";
import AlertModal from "../../components/modal/alertModel";

const ManageUsers = () => {
  const navigate = useNavigate();
  const { mappedRole, system: currentSystem } = useAuth();

  const isGlobalAdmin = mappedRole === USER_ROLES.GLOBAL_ADMIN;
  const isLocalAdmin  = mappedRole === USER_ROLES.LOCAL_ADMIN;

  const [rawUsers, setRawUsers] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [systems,  setSystems]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage,   setAlertMessage]   = useState(null);

  // helper to decide if a row is manageable (only GLOBAL_ADMIN or LOCAL_ADMIN roles)
  const canManage = (user) => {
    const sys = systems.find(s => s.system_id === user.system_id);
    const roleObj = sys?.roles?.find(r => r.displayName === user.role);
    return roleObj &&
      (roleObj.mappedRole === USER_ROLES.GLOBAL_ADMIN ||
       roleObj.mappedRole === USER_ROLES.LOCAL_ADMIN);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) fetch every user
        const userResp = await adminAPI.getUsers();
        const allUsers = userResp.data;

        // 2) build a local `allSystems` array
        let allSystems = [];
        if (isGlobalAdmin) {
          // global admin: get every system
          const fetched = await systemAPI.getAllSystems();
          allSystems = [
            {
              system_id: 0,
              name: "CMAP",
              roles: [
                { mappedRole: USER_ROLES.GLOBAL_ADMIN, displayName: "Global Admin" }
              ]
            },
            // map only the fields we need
            ...fetched.map(sys => ({
              system_id: sys.system_id,
              name: sys.name,
              roles: sys.roles || []
            }))
          ];
        } else if (isLocalAdmin) {
          // local admin: only their own system’s details
          const sysResp = await systemAPI.getSystemDetails(currentSystem);
          const sd = sysResp.data;
          allSystems = [{
            system_id: sd.system_id,
            name: sd.name,
            roles: sd.roles || []
          }];
        }

        // commit systems to state (for use in rendering & canManage)
        setSystems(allSystems);

        // 3) build the main table’s user list
        let mainList = [];
        if (isGlobalAdmin) {
          // only rows whose roleObj is GLOBAL_ADMIN or LOCAL_ADMIN
          mainList = allUsers.filter(u => {
            const sys = allSystems.find(s => s.system_id === u.system_id);
            const roleObj = sys?.roles?.find(r => r.displayName === u.role);
            return roleObj &&
              (roleObj.mappedRole === USER_ROLES.GLOBAL_ADMIN ||
               roleObj.mappedRole === USER_ROLES.LOCAL_ADMIN);
          });
        } else if (isLocalAdmin) {
          // local admin: all users in my system
          mainList = allUsers.filter(u =>
            Number(u.system_id) === Number(currentSystem)
          );
        }

        setRawUsers(allUsers);
        setUsers(mainList);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch users');
        setLoading(false);
      }
    };

    fetchData();
  }, [isGlobalAdmin, isLocalAdmin, currentSystem]);

  const handleDeleteUser = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      setUsers(us => us.filter(u => u._id !== userId));
      setRawUsers(rs => rs.filter(u => u._id !== userId));
      setAlertMessage('User deleted successfully');
      setShowAlertModal(true);
    } catch {
      setError('Failed to delete user');
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error)   return <p className="error-message">{error}</p>;

  return (
    <div className="manage-users">
      {/* Main “View and Manage Users” table */}
      <div className="manage-users-container">
        {isGlobalAdmin && <h6>View and Manage Admin Users</h6>}
        {isLocalAdmin && <h6>View and Manage Users</h6>}
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              {isGlobalAdmin && <th>System</th>}
              <th>Role</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const systemName = isGlobalAdmin
                ? (systems.find(s => s.system_id === u.system_id)?.name || '—')
                : null;
              const allowed = canManage(u);

              return (
                <tr key={u._id}>
                  <td>{`${u.first_name} ${u.last_name}`}</td>
                  <td>{u.email}</td>
                  {isGlobalAdmin && <td>{systemName}</td>}
                  <td>{formatUserRole(u.role)}</td>
                  <td>
                    {/* {allowed && ( */}
                      <button
                        className="edit-button action-button"
                        onClick={() => navigate(`/profile/${u._id}`)}
                      >
                        Edit
                      </button>
                    {/* )} */}
                  </td>
                  <td>
                    {/* {allowed && ( */}
                      <button
                        className="delete-button action-button"
                        onClick={() => handleDeleteUser(u._id)}
                      >
                        Delete
                      </button>
                    {/* )} */}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <AlertModal
          content={alertMessage}
          show={showAlertModal}
          handleClose={() => setShowAlertModal(false)}
        />
      </div>

      {/* Read-only “All Users by System” for Global Admin */}
{isGlobalAdmin && (
  <div className="manage-users-container" style={{ marginTop: '2rem' }}>
    <h6>All Other Users</h6>
    <table className="users-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>System</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {rawUsers
          .filter(u => !canManage(u))            // only those NOT global/local admin
          .map(u => {
            const sysName = systems
              .find(s => s.system_id === u.system_id)
              ?.name || '—';
            return (
              <tr key={u._id}>
                <td>{`${u.first_name} ${u.last_name}`}</td>
                <td>{u.email}</td>
                <td>{sysName}</td>
                <td>{formatUserRole(u.role)}</td>
              </tr>
            );
          })
        }
      </tbody>
    </table>
  </div>
)}

    </div>
  );
};

export default ManageUsers;

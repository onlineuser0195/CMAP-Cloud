import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { systemAPI } from '../../../api/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { USER_ROLES } from '../../../constants/constants';

const SystemDetails = () => {
  const { systemId } = useParams();
  const navigate = useNavigate();
  const [systemDetails, setSystemDetails] = useState({
    name: '',
    description: '',
    status: '',
    roles: [],
    // system_id: 1
  });
  const [isLoading, setIsLoading] = useState(true);

  const deleteSystem = async (systemId) => {
    if (!window.confirm("Are you sure you want to permanently delete this system?")) return;
    
    try {
      await systemAPI.deleteSystem(systemId);
      toast.error('System deleted successfully!');
      navigate('/'); // Or navigate to your systems list page
    } catch (error) {
      console.error('Error deleting system:', error);
      toast.error(`Error deleting system: ${error.response?.data?.message || error.message}`);
    }
  };

  useEffect(() => {
    const fetchSystemDetails = async () => {
      if (systemId !== '0') {
        try {
          const response = await systemAPI.getSystemDetails(systemId);
          setSystemDetails({
            name: response.data.name,
            description: response.data.description,
            status: response.data.status,
            roles: response.data.roles || [], 
            // system_id: response.data.system_id
          });
          console.log(systemDetails);
        } catch (error) {
          console.error('Error fetching system details:', error);
          toast.error('Failed to load system details');
        }
      }
      setIsLoading(false);
    };

    fetchSystemDetails();
  }, [systemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (systemId === '0') {
        // Create new form
        const response = await systemAPI.createSystem(systemDetails);
        navigate(`/forms-list/${response.data.system_id}`);
      } else {
        // Update existing form
        await systemAPI.updateSystemDetails(systemId, systemDetails);
        toast.success('Form details updated successfully!');
        navigate(`/forms-list/${systemId}`);
      }
    } catch (error) {
      console.error('Error saving system:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                {systemId === '0' ? 'Create New System' : 'Edit System Details'}
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">System Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={systemDetails.name}
                    onChange={(e) => setSystemDetails({...systemDetails, name: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description:</label>
                  <textarea
                    className="form-control"
                    value={systemDetails.description}
                    onChange={(e) => setSystemDetails({...systemDetails, description: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status:</label>
                  <select
                    className="form-control"
                    value={systemDetails.status}
                    onChange={(e) =>
                      setSystemDetails({ ...systemDetails, status: e.target.value })
                    }
                    required
                  >
                    <option value="" disabled>Select a status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="updates">Updates</option>
                    <option value="upgrades">Upgrades</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Custom Role Mappings:</label>
                  {systemDetails.roles.map((role, index) => (
                    <div key={index} className="d-flex mb-2 gap-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Display Name"
                        value={role.displayName}
                        onChange={(e) => {
                          const updatedRoles = [...systemDetails.roles];
                          updatedRoles[index].displayName = e.target.value;
                          setSystemDetails({ ...systemDetails, roles: updatedRoles });
                        }}
                        required
                      />
                      <select
                        className="form-select"
                        value={role.mappedRole}
                        onChange={(e) => {
                          const updatedRoles = [...systemDetails.roles];
                          updatedRoles[index].mappedRole = e.target.value;
                          setSystemDetails({ ...systemDetails, roles: updatedRoles });
                        }}
                        required
                      >
                        <option value="" disabled>Select role</option>
                        {Object.values(USER_ROLES).map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => {
                          const updatedRoles = [...systemDetails.roles];
                          updatedRoles.splice(index, 1);
                          setSystemDetails({ ...systemDetails, roles: updatedRoles });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <br/>
                  <button
                    type="button"
                    className="btn btn-outline-primary mt-2"
                    onClick={() =>
                      setSystemDetails({
                        ...systemDetails,
                        roles: [...systemDetails.roles, { displayName: '', mappedRole: '' }]
                      })
                    }
                  >
                    + Add Role Mapping
                  </button>
                </div>

                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  {systemId !== '0' &&
                  <button 
                    className="btn btn-danger"
                    onClick={(e) => {
                        e.preventDefault();
                        deleteSystem(systemId);
                      }}
                  >
                    {/* <i className="fa-regular fa-circle-xmark"></i> */}
                    Delete System
                  </button>}
                  <button type="submit" className="btn btn-primary">
                    {systemId === '0' ? 'Create System' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDetails;
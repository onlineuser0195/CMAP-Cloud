import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formAPI } from '../api/api';
import { USER_ROLES } from '../constants/constants';
import '../styles/layouts/Dashboard.css'
import CloneFormsModal from './admin/form/CloneFormsModal';
import SystemsList from '../components/SystemsList';
import { SystemDashboard } from '../components/SystemDashboard';
import useAuth from '../hooks/AuthContext';
import {Visibility as ViewIcon} from '@mui/icons-material';

const Dashboard = () => {
  // const [systems, setSystems] = useState([]);
  const { userRole, mappedRole } = useAuth();   
  // const [error, setError] = useState(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  // const [forms, setForms] = useState([]);
  // const [role, setUserRole] = useState(null);
  // const navigate = useNavigate();

  // useEffect(() => {
  //     const userRole = localStorage.getItem(USER_ROLE_KEY);
  //     setUserRole(userRole);
  //     console.log(userRole)
  //     // If the role is not found or invalid, redirect to the login page
  //     if (!userRole) {
  //         navigate('/login');
  //     }
  // }, []);

  // const fetchForms = async () => {
  //     try {
  //     const formsData = await formAPI.getAllForms(0);
  //     console.log('Forms Data:', formsData);
  //     setForms(formsData);
  //     } catch (error) {
  //     console.error('Error fetching forms:', error);
  //     setError('Failed to load forms.');  // Optional: Display error if fetching fails
  //     }
  // };
  // useEffect(() => {
  // fetchForms();
  // }, []);

  // if (error) {
  //   return <div className="alert alert-danger">{error}</div>;
  // }

  return (
    <div>
      <div className="dashboard-container">
        {mappedRole === USER_ROLES.GLOBAL_ADMIN && 
          <div className="row">
            <div className="col-12 d-flex justify-content-center position-relative">
              {/* Center button */}
              <Link to="/system/0" className="btn btn-success">
                <i className="fas fa-plus me-2"></i>Add a New System
              </Link>

              {/* Right-aligned button */}
              <div className="position-absolute end-0">
                <Link to="/mongodb-tools" className="btn btn-warning">
                  <i className="fas fa-download me-2"></i>Import/Export DB
                </Link>
              </div>
            </div>
          </div>}
        {/* Systems List Component */}
        <SystemsList role={mappedRole} />
        {mappedRole === USER_ROLES.GLOBAL_ADMIN && <div className="mt-3">
          <div className="row">
            <div className="col-3 text-center">
              <Link to="/forms-list/0" className="btn btn-success">
                <i className="fas fa-eye me-2"></i>View All Forms
              </Link>
            </div>
            <div className="col-3 text-center">
              <Link to="/home/forms-status" className="btn btn-success">
                <i className="fas fa-eye me-2"></i>View Systems Forms
              </Link>
            </div>
            <div className="col-3 text-center">
              <Link to="/form-details/0" className="btn btn-success">
                <i className="fas fa-edit me-2"></i>Create New Form
              </Link>
            </div>
            <div className="col-3 text-center">
              <button 
                  className="btn btn-success"
                  onClick={() => setShowCloneModal(true)}
              >
                  <i className="fas fa-copy me-2"></i>Clone Forms
              </button>
            </div>
          </div>
        </div>}
        {mappedRole === USER_ROLES.LOCAL_ADMIN &&
        <div className="mt-3">
          <div className="row">
            <div className="col-12 text-center">
              <Link to="/form-details/0" className="btn btn-success">
                <i className="fas fa-edit me-2"></i>Create New Form
              </Link>
            </div>
          </div>
        </div>
        }
      </div>
      {mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole !== USER_ROLES.LOCAL_ADMIN && <SystemDashboard />}
      {mappedRole === USER_ROLES.GLOBAL_ADMIN &&
      <CloneFormsModal 
        show={showCloneModal}
        onHide={() => setShowCloneModal(false)}
        refreshForms={() => fetchForms()} // Pass your existing fetchForms function
      />}
    </div>
  );
};

export default Dashboard;
import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import '../../styles/layouts/Dashboard.css'
import PrismFormsList from '../layouts/PrismFormsList';
import { PrismDashboard } from '../components/PrismDashboard';
import useAuth from '../../hooks/AuthContext';
import BackButton from '../../components/buttons/BackButton';
import { systemAPI } from '../../api/api';
import { USER_ROLES } from '../../constants/constants';
import Tooltip from '@mui/material/Tooltip';


export const PrismDashboardPage = ({systemId: propSystemId}) => {
  const [error, setError] = useState(null);
  const { userRole, mappedRole } = useAuth();   
  // const [role, setUserRole] = useState(null);
  // const navigate = useNavigate();

  const [systemName, setSystemName] = useState('');
  const [systemDesc, setSystemDesc] = useState('');
  const { systemId: paramSystemId  } = useParams();
  
  const systemId = propSystemId || paramSystemId;
  
  useEffect(() => {
    const fetchSystemName = async () => {
      try {
        const response = await systemAPI.getSystemDetails(systemId);
        setSystemName(response.data.name); // Assuming API returns { name: 'System A', ... }
        setSystemDesc(response.data.description)
      } catch (err) {
        console.error('Failed to fetch system name:', err);
        setError('Failed to load system details');
      }
    };

    fetchSystemName();
  }, [systemId]);

  // useEffect(() => {
  //     const userRole = localStorage.getItem(USER_ROLE_KEY);
  //     setUserRole(userRole);
  //     console.log(userRole)
  //     // If the role is not found or invalid, redirect to the login page
  //     if (!userRole) {
  //         navigate('/login');
  //     }
  // }, []);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div className="dashboard-container">
      {mappedRole == USER_ROLES.GLOBAL_ADMIN || mappedRole == USER_ROLES.LOCAL_ADMIN && <><BackButton label="Global Dashboard" /><br/></>}
        {/* Systems List Component */}
        <h2 className="text-center my-4">
            {systemName ? `${systemName} - ` : 'System'} Dashboard
        </h2>
        <Tooltip
          placement="top-end"
          title={
            <span style={{ fontSize: '14px', lineHeight: 1.4 }}>
              {systemDesc}
            </span>
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="info-icon bi bi-info-circle-fill"
            viewBox="0 0 16 16"
            style={{ cursor: 'help',
            position:   'absolute',
            top:        '125px',
            right:      '50px',
            zIndex:     1000
          }}
          >
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 
                    .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319
                    l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 
                    5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
          </svg>
        </Tooltip>
        <h4>Forms List</h4>
        <PrismFormsList systemId={systemId}/>
      </div>
      {mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole !== USER_ROLES.LOCAL_ADMIN && <PrismDashboard systemId={systemId} />}
    </div>
  );
};

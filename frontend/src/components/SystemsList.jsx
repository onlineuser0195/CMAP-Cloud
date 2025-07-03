import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { systemAPI } from '../api/api';
import { Button, Box, Chip } from '@mui/material';
import { USER_ROLES,  USER_SYSTEM} from '../constants/constants';
import '../styles/components/SystemsList.css';
import useAuth from '../hooks/AuthContext';

const SystemsList = ({ role }) => {
  const [systems, setSystems] = useState([]);
  const [error, setError] = useState(null);
  const { system } = useAuth();

  const statusColors = {
    active: 'success',
    maintenance: 'warning',
    updates: 'info',
    upgrades: 'info',
    inactive: 'grey'
  };

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const systemsData = await systemAPI.getAllSystems();
        setSystems(systemsData);
      } catch (error) {
        console.error('Error fetching systems:', error);
        setError('Failed to load systems.');
      }
    };
    fetchSystems();
  }, []);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="systems-list">
      <h2 className="mb-4">Systems Available</h2>
      <div className="row">
        {systems.map(sys => (
          ( (system == 0 || sys.system_id == system) &&
          <div key={sys.system_id} className="col-md-4 mb-4">
            <Link 
              to={`/system-dashboard/${sys.system_id}`} className="card-link"
            >
            <div className={`system-card card h-100 ${sys.status!=='active' ? 'greyed-out-system' : ''}`}>
              <div className="card-body d-flex flex-column">
                <Chip
                  className="ml-10"
                  label={sys.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  size="small"
                  color={statusColors[sys.status]}
                  sx={{ position: 'absolute',top: 10, right: 10 }}/>
                <br/>
                <h3 className="card-title">{sys.name}</h3>
                <p className="card-text">{sys.description}</p>
                <div className="mt-auto flex-wrap justify-content-center">
                  {(role === USER_ROLES.GLOBAL_ADMIN || role === USER_ROLES.LOCAL_ADMIN) && (
                    <span className='m-2'>
                      <Link 
                        to={`/system/${sys.system_id}`}
                        className="btn btn-primary"
                      >
                        <i className="fas fa-pen me-2"></i>
                        Edit System Details
                      </Link>
                    </span>
                  )}
                  {role !== USER_ROLES.GLOBAL_ADMIN && role !== USER_ROLES.LOCAL_ADMIN && 
                  <span>
                    <Link 
                      to={`/forms-list/${sys.system_id}`}
                      className="btn btn-primary"
                    ><i className="fas fa-eye me-2"></i>
                      View Forms
                    </Link>
                  </span>}
                  {role !== USER_ROLES.GLOBAL_ADMIN && role !== USER_ROLES.LOCAL_ADMIN && 
                    <span>
                      {sys.system_id===2 && <Link className="btn btn-success text-white" style={{marginLeft: '10px', float: 'right'}} to={`/form-dashboard/9`} state={sys.system_id ? { systemId: sys.system_id } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-2"></i>
                          Visit Request
                      </Link>}
                    </span>
                  }
                </div>
              </div>
            </div>
            </Link>
          </div>)
        ))}
      </div>
    </div>
  );
};

export default SystemsList;
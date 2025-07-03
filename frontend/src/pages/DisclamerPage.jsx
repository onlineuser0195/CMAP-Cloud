import React, { useEffect, useState } from 'react';
import { Typography, Button, Paper, Box } from "@mui/material";
import { useParams, Link } from "react-router-dom";
import '../styles/layouts/Dashboard.css'
import useAuth from '../hooks/AuthContext';
import BackButton from '../components/buttons/BackButton';
import { systemAPI } from '../api/api';
import { USER_ROLES } from '../constants/constants';
import Tooltip from '@mui/material/Tooltip';


export const DisclamerPage = ({systemId: propSystemId}) => {
  const [error, setError] = useState(null);
  const { userRole, mappedRole } = useAuth();   
  // const [role, setUserRole] = useState(null);
  // const navigate = useNavigate();

  const [systemName, setSystemName] = useState('');
  const [systemFullName, setSystemFullName] = useState('');
  const [systemDesc, setSystemDesc] = useState('');
  const { systemId: paramSystemId  } = useParams();
  
  const systemId = propSystemId || paramSystemId;
  
  useEffect(() => {
    const fetchSystemName = async () => {
      try {
        const response = await systemAPI.getSystemDetails(systemId);
        setSystemName(response.data.name); // Assuming API returns { name: 'System A', ... }
        setSystemFullName(response.data.full_name);
        setSystemDesc(response.data.description)
      } catch (err) {
        console.error('Failed to fetch system name:', err);
        setError('Failed to load system details');
      }
    };

    fetchSystemName();
  }, [systemId]);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div className="dashboard-container">
      {mappedRole == USER_ROLES.GLOBAL_ADMIN && <><BackButton label="Global Dashboard" /><br/></>}
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
            zIndex:     999
          }}
          >
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 
                    .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319
                    l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 
                    5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
          </svg>
        </Tooltip>

        <div className='text-center'>
        <span className='text-center' style={{fontSize: '30px', color: 'green', fontWeight: 'bolder', marginBottom: '10px'}}>
        Welcome to {systemName}, you have logged in as {userRole}.
        </span><br/>
        {mappedRole !== USER_ROLES.GLOBAL_ADMIN && 
          <span className='text-center' style={{fontSize: '30px'}}>
            Please read the disclaimer before you begin using the system...
            <br/>
            <Paper elevation={3} className="p-4" style={{ textAlign: "center" }}>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {systemFullName}
                </Typography>

                <Box
                    className="p-3"
                    style={{
                        border: "2px solid red",
                        borderRadius: "2px",
                        backgroundColor: "#fff",
                        textAlign: "left",
                    }}
                >
                    <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>
                        YOU ARE ENTERING A SECURE SYSTEM
                    </Typography>
                    <Typography sx={{ fontSize: '13px', lineHeight: 1.2 }} color="text.secondary">
                        This Is A CMAP Computer System. This Computer System, Including All Related Equipment, Networks And Network Devices (Specifically Including Internet Access), Are Provided Only For Authorized U.S. Government Use. CMAP Computer Systems May Be Monitored For All Lawful Purposes, Including To Ensure That Their Use Is Authorized, For Management Of The System, To Facilitate Protection Against Unauthorized Access, And To Verify Security Procedures, Survivability And Operational Security. Monitoring Includes Active Attacks By Authorized CMAP Entities To Test Or Verify The Security Of This System. During Monitoring, Information May Be Examined, Recorded, Copied And Used For Authorized Purposes. All Information, Including Personal Information, Placed On Or Sent Over This System May Be Monitored. Use Of This CMAP Computer System, Authorized Or Unauthorized, Constitutes Consent To Monitoring Of This System. Unauthorized Use May Subject You To Criminal Prosecution. Evidence Of Unauthorized Use Collected During Monitoring May Be Used For Administrative, Criminal Or Other Adverse Action. Use Of This System Constitutes Consent To Monitoring For These Purposes.
                    </Typography>
      
                    <Typography sx={{ fontSize: '13px', marginTop: '5px', lineHeight: 1.2, fontWeight: 'bolder' }} color="text.secondary">
                        You are about to enter the secure website.<br /><br />
                    </Typography>

                    <Box textAlign="center">
                      {/* FVS */}
                      {systemId==2 && (mappedRole == USER_ROLES.APP_USER || mappedRole == USER_ROLES.SUPERVISOR) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/form-dashboard/9`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          Visit Requests
                      </Link>}
                      {systemId==2 && (mappedRole == USER_ROLES.CONFIRMATION_USER) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/confirmation-user`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          Visit Requests
                      </Link>}
                      {systemId==2 && (mappedRole == USER_ROLES.VIEWER) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/fvs-admin`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          Visit Requests
                      </Link>}
                      {systemId==2 && (mappedRole == USER_ROLES.LOCAL_ADMIN) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/config-specialist`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          Visit Requests
                      </Link>}


                      {/* PRISM */}
                      {systemId==5 && (mappedRole == USER_ROLES.PROJECT_MANAGER) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/prism-form-dashboard/11`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          View Projects
                      </Link>}
                      {systemId==5 && (mappedRole == USER_ROLES.GOVERNMENT_LEAD) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/prism-form-dashboard/11`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          View Projects
                      </Link>}
                      {systemId==5 && (mappedRole == USER_ROLES.PORTFOLIO_OWNER) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/project-owner/11`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          View Projects
                      </Link>}
                      {systemId==5 && (mappedRole == USER_ROLES.LOCAL_ADMIN) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/local-admin`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          Manage System and Users
                      </Link>}

                      {/* ELISA */}
                      {systemId==4 && (mappedRole == USER_ROLES.LOCAL_ADMIN) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/local-admin`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          Manage System  and Users
                      </Link>}
                      {systemId==4 && (mappedRole == USER_ROLES.IT_USER) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/it-user`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          Manage Reports
                      </Link>}
                      {systemId==4 && (mappedRole == USER_ROLES.SPAN_SUPPORT_USER) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/span-user`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          Manage Reports
                      </Link>}
                      {systemId==4 && (mappedRole == USER_ROLES.INDUSTRY_APPLICANT) && <Link className="btn btn-success text-white" style={{marginLeft: '10px', padding: '20px', fontSize:'30px'}} to={`/industry-applicant`} state={systemId ? { systemId: systemId } : undefined}> 
                      <i className="fa-solid fa-paper-plane me-3"></i>
                          Case Results
                      </Link>}
                    </Box>
                </Box>
            </Paper>

          </span>
        }
        </div>
      </div>
    </div>
  );
};

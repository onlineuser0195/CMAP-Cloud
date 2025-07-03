import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { formAPI, systemAPI } from '../api/api';
import useAuth from '../hooks/AuthContext';
import BackButton from '../components/buttons/BackButton';
import { USER_ROLES } from '../constants/constants';
import '../styles/layouts/FormDetails.css';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ExcelImportButton from '../components/buttons/ExcelImportButton';
import { API_URL } from '../constants/constants';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FormDetails = () => {
  const { formId } = useParams();
  const location = useLocation();
  const systemId = location.state?.systemId;
  const respId = location.state?.respId;
  console.log(respId);
  const { groupId } = location.state || {};
  console.log(groupId);
  // const { groupId } = location.state || {};
  const [systemName, setSystemName] = useState('');
  const [error, setError] = useState(null);
  const [openPDF, setOpenPDF] = useState(false);
  const handleOpenPDF = () => setOpenPDF(true);
  const handleClosePDF = () => setOpenPDF(false);
  const navigate = useNavigate();
  const [formDetails, setFormDetails] = useState({
    name: '',
    description: '',
    file: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const { userRole, mappedRole } = useAuth();   

  // const [role, setUserRole] = useState(null);  
  // useEffect(() => {
  //     const userRole = localStorage.getItem(USER_ROLE_KEY);
  //     setUserRole(userRole);
  //     console.log(userRole)
  //     // If the role is not found or invalid, redirect to the login page
  //     if (!userRole) {
  //         navigate('/login');
  //     }
  // }, []);

  useEffect(() => {
    const fetchFormDetails = async () => {
      if (formId !== '0') {
        try {
          const response = await formAPI.getFormDetails(formId);
          setFormDetails({
            name: response.data.name,
            description: response.data.description,
            file: response.data.info?.file_path || null
            // system_id: response.data.system_id
          });

        } catch (error) {
          console.error('Error fetching form details:', error);
          toast.error('Failed to load form details');
        }
      }
      setIsLoading(false);
    };

    fetchFormDetails();
  }, [formId]);
  console.log(formDetails);
  useEffect(() => {
    if (!systemId) return; 
    const fetchSystemName = async () => {
      try {
        const response = await systemAPI.getSystemDetails(systemId);
        setSystemName(response.data.name); // Assuming API returns { name: 'System A', ... }
      } catch (err) {
        console.error('Failed to fetch system name:', err);
        setError('Failed to load system details');
      }
    };

    fetchSystemName();
  }, [systemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', formDetails.name);
      formData.append('description', formDetails.description);
      if (formDetails.file) {
        formData.append('file', formDetails.file);
      }
  
      if (mappedRole === USER_ROLES.GLOBAL_ADMIN || mappedRole === USER_ROLES.LOCAL_ADMIN) {
        if (formId === '0') {
          const response = await formAPI.createForm(formData); // now sending FormData
          navigate(`/form-builder/${response.data.form_id}`);
        } else {
          await formAPI.updateFormDetails(formId, formData);
          toast.success('Form details updated successfully!');
          navigate(`/form-builder/${formId}`);
        }
      } else {
        if (groupId) {
          navigate(`/systems/${systemId}/form/${formId}/group/${groupId}`)
        } else {
          navigate(`/systems/${systemId}/form/${formId}/response/${respId}`)
        }
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };
  

  if (isLoading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="container mt-5">
      {(mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole !== USER_ROLES.LOCAL_ADMIN) ? <BackButton label='Responses' /> : <BackButton label='System' />}
      { formId !== '0' && mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole !== USER_ROLES.LOCAL_ADMIN && formDetails.file && <Tooltip placement="top-end" title="View Instruction Document">
        <div style={{ position: 'relative' }}>
            <svg xmlns="http://www.w3.org/2000/svg" onClick={handleOpenPDF} width="16" height="16" fill="currentColor" className="info-icon bi bi-info-circle-fill" viewBox="0 0 16 16">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
            </svg>
        </div>
      </Tooltip>}
      {/* { formId === '0' && <ExcelImportButton /> } */}
      <div className='text-center my-4'>
        <h2> { formId === '0' ? 'Create New Form' : formDetails.name}</h2>
        <span className='my-4'>{(mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole !== USER_ROLES.LOCAL_ADMIN) &&
          <small className="text-muted"> 
            System: <strong>{systemName}</strong>
          </small>}
        </span>
      </div>
      <div className="row justify-content-center">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Form Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formDetails.name}
                    onChange={(e) => setFormDetails({...formDetails, name: e.target.value})}
                    required
                    disabled={mappedRole === USER_ROLES.APP_USER}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description:</label>
                  <textarea
                    className="form-control"
                    value={formDetails.description}
                    onChange={(e) => setFormDetails({...formDetails, description: e.target.value})}
                    disabled={mappedRole === USER_ROLES.APP_USER}
                  />
                </div>
                {(mappedRole === USER_ROLES.GLOBAL_ADMIN || mappedRole === USER_ROLES.LOCAL_ADMIN) && (
                <div className="mb-3">
                  <label className="form-label">Instruction File (PDF only)</label>
                  <br/>
                  <span onClick={handleOpenPDF}   
                    style={{
                      color: '#0d6efd',        // Bootstrap primary blue
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}>
                      {formDetails.filePath?.split('/').pop() || 'View Uploaded Instruction File'}
                  </span>
                  <input
                    type="file"
                    className="form-control"
                    accept="application/pdf"
                    onChange={(e) => setFormDetails({...formDetails, file: e.target.files[0]})}
                    disabled={mappedRole === USER_ROLES.APP_USER}
                  />
                </div>)}
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {(mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole !== USER_ROLES.LOCAL_ADMIN)? 'Next' : (
                      formId === '0' ? 'Create Form' : 'Save Changes'
                    )}                  
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={openPDF} onClose={handleClosePDF} maxWidth="md" fullWidth>
        <div style={{ height: '100vh' }}>
          <iframe
            src={`/api/${formDetails.file}`}
            // src="/FVS_FVSCM_SPAN_User_Registration_Form.pdf"
            title="Instruction Document"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default FormDetails;
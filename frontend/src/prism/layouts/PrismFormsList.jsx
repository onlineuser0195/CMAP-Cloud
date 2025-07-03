import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { USER_ROLES } from '../../constants/constants';
import { Link, useParams } from 'react-router-dom';
import { formAPI, systemAPI  } from '../../api/api';
import AddFormsModal from '../../layouts/admin/system/AddFormsModal';
import { Button, Box, Chip } from '@mui/material';
import useAuth from '../../hooks/AuthContext';

const FormsList = ({ systemId: propSystemId }) => {
    // const { systemId } = useParams();
    const { systemId: paramSystemId } = useParams();
    const systemId = propSystemId ?? paramSystemId;
    const [showAddModal, setShowAddModal] = useState(false);
    const { userRole, mappedRole } = useAuth();   

    const [forms, setForms] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    // const [role, setUserRole] = useState(null);
    const navigate = useNavigate();

    const statusColors = {
        submitted: 'success',
        in_progress: 'info',
        not_started: 'warning',
        approved: 'success',
        not_approved: 'warning',
        not_assessed: 'info',
        not_reviewed: 'info',
        true: 'success',
        false: 'warning'
      };
  
    // useEffect(() => {
    //     const userRole = localStorage.getItem(USER_ROLE_KEY);
    //     setUserRole(userRole);
    //     console.log(userRole)
    //     // If the role is not found or invalid, redirect to the login page
    //     if (!userRole) {
    //         navigate('/login');
    //     }
    // }, []);

    // useEffect(() => {
    const fetchForms = async () => {
        try {
        var formsData = await formAPI.getAllSystemForms(systemId);
        if (mappedRole===USER_ROLES.GLOBAL_ADMIN || mappedRole===USER_ROLES.LOCAL_ADMIN){
            formsData = await formAPI.getAllForms(systemId);
        } else {
            formsData = await formAPI.getAllSystemForms(systemId);
        }
        console.log('Forms Data:', formsData);
        setForms(formsData);
        } catch (error) {
        console.error('Error fetching forms:', error);
        setError('Failed to load forms.');  // Optional: Display error if fetching fails
        }
    };
    useEffect(() => {
        if (mappedRole) {
            fetchForms();
          }
    }, [mappedRole, systemId]);

    // Handle form removal
    const handleRemoveForm = async (systemId, formId) => {
        if (!window.confirm("Are you sure you want to remove this form?")) return;
        try {
            await systemAPI.removeFormFromSystem(Number(systemId), Number(formId));
            setForms(forms.filter(form => form.form_id !== formId)); // Update state immediately
            //fetchForms();
        } catch (error) {
            console.error('Error removing form:', error);
            // alert("Failed to remove the form.");
        }
    };

    // Handle form removal
    const handleDeleteForm  = async (formId) => {
        if (!window.confirm("Are you sure you want to delete this form?")) return;
        try {
            await formAPI.deleteForm(formId);
            setForms(forms.filter(form => form.form_id !== formId)); // Update state immediately
            //fetchForms();
        } catch (error) {
            console.error('Error deleting form:', error);
            // alert("Failed to delete the form.");
        }
    };

    const handleToggleActive = async (formId, activeStatus) => {
        setLoading(true);
        try {
          // Toggle the active status.
        //   const newActive = !form.active;
          // Call your API to update the active status.
          // (Make sure formAPI.updateActiveStatus is implemented on the backend.)
            await formAPI.updateActiveStatus(formId, activeStatus);
          // Notify parent component of the change so UI can update.
          setForms(prevForms =>
            prevForms.map(form =>
              form.form_id === formId ? { ...form, active: activeStatus } : form
            )
          );
        } catch (error) {
          console.error('Error toggling active status:', error);
        } finally {
          setLoading(false);
        }
      };

    return (
        <div>
            <div>
                <ol className="forms-list">
                {forms.map(form => (
                    <li key={form.form_id}>
                    <span>
                        {/* <span>{form.form_id}</span> */}
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', ml: 1, mb: 1 }}>
                            {mappedRole!=USER_ROLES.GLOBAL_ADMIN &&  mappedRole!=USER_ROLES.LOCAL_ADMIN &&
                            <Link className="m-10 p-10" to={`/prism-form-dashboard/${form.form_id}`} state={systemId ? { systemId } : undefined}> {form.name}</Link>}
                            {(mappedRole== USER_ROLES.GLOBAL_ADMIN ||  mappedRole==USER_ROLES.LOCAL_ADMIN) &&
                            <Link className="m-10 p-10" to={`/form-details/${form.form_id}`} state={systemId ? { systemId } : undefined}> {form.name}</Link>}
                            {(mappedRole === USER_ROLES.GLOBAL_ADMIN ||  mappedRole===USER_ROLES.LOCAL_ADMIN) &&<span className='p-2'><i 
                                className="fa-regular fa-circle-xmark text-danger"
                                style={{ cursor: "pointer" }}
                                title={Number(systemId) === 0 ? "Delete Form" : "Remove Form"}
                                onClick={() => {
                                    if (Number(systemId) === 0) {
                                        handleDeleteForm(Number(form.form_id));
                                    } else {
                                        handleRemoveForm(Number(systemId), Number(form.form_id));
                                    }
                                }}
                            ></i></span>}
                            {mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole!==USER_ROLES.LOCAL_ADMIN &&<div>
                                <Chip
                                className="ml-10"
                                label={`${form.progress.not_started} On Hold`}
                                size="small"
                                color={statusColors['not_started']}
                                sx={{ mr: 2, ml: 2 }}/>
                                <Chip
                                className="ml-10"
                                label={`${form.progress.in_progress} In Progress`}
                                size="small"
                                color={statusColors['in_progress']}
                                sx={{ mr: 2, ml: 0 }}/>
                                <Chip
                                className="ml-10"
                                label={`${form.progress.submitted} Completed`}
                                size="small"
                                color={statusColors['submitted']}
                                sx={{ mr: 2, ml: 0 }}/>
                                </div>
                            }
                            {(mappedRole === USER_ROLES.GLOBAL_ADMIN || mappedRole===USER_ROLES.LOCAL_ADMIN) &&
                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr:2}}>
                                <Chip
                                className="ml-10 mr-10"
                                // label={'Active: '+form.active}
                                label={`Active: ${form.active === "true" ? 'Yes' : 'No'}`}
                                size="small"
                                color={statusColors[form.active] || 'warning'}
                                sx={{ mr: 2, ml: 2 }}/>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleToggleActive(form.form_id, form.active === "true"? "false": "true")}
                                    disabled={loading}
                                >
                                    {loading
                                    ? 'Updating...'
                                    : form.active === "true"
                                    ? 'Deactivate'
                                    : 'Activate'}
                                </Button>
                                </Box>
                            }
                        </Box>
                    </span>
                    </li>
                ))}
                </ol>
                {systemId != 0 && (mappedRole === USER_ROLES.GLOBAL_ADMIN || mappedRole===USER_ROLES.LOCAL_ADMIN) &&(
                <div className="col-12 text-center">
                    <button 
                        className="btn btn-success"
                        onClick={() => setShowAddModal(true)}
                    >
                        <i className="fas fa-plus me-2"></i>Add Existing Forms
                    </button>
                </div>
                )}
            </div>
                <AddFormsModal 
                show={showAddModal}
                onHide={() => setShowAddModal(false)}
                systemId={systemId}
                refreshForms={() => fetchForms()} // Pass your existing fetchForms function
            />
        </div>
    );
};

export default FormsList;
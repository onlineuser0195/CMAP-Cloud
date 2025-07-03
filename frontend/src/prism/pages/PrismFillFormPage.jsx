import React, { useEffect, useState } from 'react';
import { PrismFillForm } from '../layouts/project_manager/PrismFillForm'
import { PrismFormApproval } from '../layouts/government_lead/PrismFormApproval';
import useAuth from '../../hooks/AuthContext';
import BackButton from '../../components/buttons/BackButton';
import { USER_ROLES } from '../../constants/constants';
import PrismViewForm from '../layouts/portfolio_owner/PrismViewForm';

export const PrismFillFormPage = () => {
  const [error, setError] = useState(null);
  const { userRole, mappedRole } = useAuth();

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
  return (
    <>
      {(mappedRole === USER_ROLES.PROJECT_MANAGER )&& <PrismFillForm />}
      {mappedRole === USER_ROLES.GOVERNMENT_LEAD && <PrismFormApproval />}
      {mappedRole === USER_ROLES.PORTFOLIO_OWNER && (<PrismViewForm />)}
    </>
  );
};

export default PrismFillFormPage;
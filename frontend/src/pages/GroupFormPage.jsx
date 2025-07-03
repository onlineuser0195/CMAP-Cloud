import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/AuthContext';
import BackButton from '../components/buttons/BackButton';
import { USER_ROLES } from '../constants/constants';
import { GroupFillForm } from '../layouts/user/GroupFillForm';
import { GroupFormApproval } from '../layouts/supervisor/GroupFormApproval';

export const GroupFormPage = () => {
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
    <div className='pt-2 ml-4'>
      <BackButton label='Form Details' pos='fixed'/>
        {/* <h1 className="pt-5 text-center">
          {mappedRole === USER_ROLES.APP_USER ? 'Group Forms Submission' : 'Approval Review (Group Visit)'}
        </h1>         */}
        {mappedRole === USER_ROLES.APP_USER && <GroupFillForm />}
        {mappedRole === USER_ROLES.SUPERVISOR && <GroupFormApproval/>}
    </div>
  );
};

export default GroupFormPage;
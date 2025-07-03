import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import BackButton from '../components/buttons/BackButton';
import { systemAPI } from '../api/api';
import FormsList from '../layouts/FormsList';

const FormsListPage = () => {
  const [error, setError] = useState(null);
  const [systemName, setSystemName] = useState('');
  const { systemId } = useParams();

  if (systemId!=0){
    useEffect(() => {
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

    if (error) {
      return <div className="alert alert-danger">{error}</div>;
    }
  }
  return (
    <div>
      <BackButton label="Global Dashboard" />
      <h1 className="text-center my-4">Forms List</h1>
        <h2 className="text-center my-4 mt-5">
            {systemName ? `${systemName}` : 'All System Forms'}
        </h2>
      <FormsList />
    </div>
  );
};
// Add section_ids and put field_ids into that
export default FormsListPage;
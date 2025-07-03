import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import BackButton from '../components/buttons/BackButton';
import { systemAPI, formAPI } from '../api/api';
import PDFSearch from '../layouts/PDFSearch';

const PDFSearchPage = () => {
  
  const { systemId, formId } = useParams();
  const [error, setError] = useState(null);
  const [systemName, setSystemName] = useState('');
  const [formName, setFormName] = useState('');

  if (systemId!=0){
    useEffect(() => {
      const fetchSystemName = async () => {
        try {
          const response = await systemAPI.getSystemDetails(systemId);
          setSystemName(response.data.name);
          const formRes = await formAPI.getBuildForm(formId);
          setFormName(formRes.data.name);
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
      <BackButton label="Form Dashboard" />
      <h1 className="text-center mt-4">Multi-File Search</h1>
      <div className="text-center">
        <h2 className="fw-semibold mb-1">Visit Requests</h2>
        <h4 className="text-muted">
          System: <strong>{systemName}</strong> <br/>
        </h4>
      </div>
      <PDFSearch systemId={systemId} formId={formId} />
    </div>
  );
};
export default PDFSearchPage;
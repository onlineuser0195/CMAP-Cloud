import React, { useEffect, useState } from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from './buttons/BackButton';
import { formAPI, systemAPI } from '../api/api';

export const SystemLayout = ({ children, systemId, formId }) => {
  const navigate = useNavigate();
  const { systemId: paramId } = useParams();
  const currentSystemId = systemId || paramId;
  const [error, setError] = useState(null);

  const [systemName, setSystemName] = useState('');
  const [formName, setFormName] = useState('');

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

  useEffect(() => {
    const fetchFormName = async () => {
      try {
        const response = await formAPI.getFormDetails(formId);
        setFormName(response.data.name); // Assuming API returns { name: 'System A', ... }
      } catch (err) {
        console.error('Failed to fetch system name:', err);
        setError('Failed to load system details');
      }
    };

    fetchFormName();
  }, [formId]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* Breadcrumb Navigation */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            onClick={() => navigate('/home')}
            sx={{ cursor: 'pointer' }}
          >
            Dashboard
          </Link>
          {systemName && (
            <Typography color="text.primary">
              {systemName}
            </Typography>
          )}
          {formName && (
            <Typography color="text.primary">
              {formName}
            </Typography>
          )}
        </Breadcrumbs>

        <BackButton />

        {/* System Header */}
        {systemName && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              {systemName} Overview
            </Typography>
          </Box>
        )}
        {formName && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              {formName} Responses
            </Typography>
          </Box>
        )}
        {/* Page Content */}
        {children}

        {/* Optional Footer */}
        {/* <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            {currentSystemId ? `System ID: ${currentSystemId}` : 'All Systems View'}
          </Typography>
        </Box> */}
      </Box>
    </Box>
  );
};

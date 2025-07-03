import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';
import ErrorIcon from '@mui/icons-material/ErrorOutline';

export const ErrorAlert = ({ message = 'An error occurred', severity = 'error' }) => {
  return (
    <Box my={4}>
      <Alert 
        severity={severity}
        icon={<ErrorIcon fontSize="large" />}
        variant="filled"
      >
        <AlertTitle>{severity.charAt(0).toUpperCase() + severity.slice(1)}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};
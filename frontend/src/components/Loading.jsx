import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

export const Loading = ({ message = 'Loading...' }) => {
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="200px"
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="subtitle1" mt={2}>
        {message}
      </Typography>
    </Box>
  );
};
// components/CurrentDate.js
import React from 'react';

export const CurrentDate = () => {
  const today = new Date().toLocaleDateString();

  return (
    <div style={{
      position: 'fixed',
      top: '70px', // Below the navbar
      right: '10px',
      backgroundColor: '#444',
      color: '#fff',
      padding: '4px 7px',
      borderRadius: '6px',
      fontSize: '0.70rem',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
      zIndex: 1000
    }}>
    Date: {today}
    </div>
  );
};
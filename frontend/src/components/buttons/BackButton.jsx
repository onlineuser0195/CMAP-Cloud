// components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import "../../styles/components/BackButton.css";

const BackButton = ({ label = '', onClick, pos='null' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };
  const classNames = `back-button ${pos == 'fixed' ? 'fixed' : ''}`;

  return (
    <button className={classNames}  onClick={handleClick}>
      <ArrowBackIcon style={{ marginRight: '5px' }} />
      Back{label ? ` to ${label}` : ''}
    </button>
  );
};

export default BackButton;

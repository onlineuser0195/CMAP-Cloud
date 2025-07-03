import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  IconButton, 
  useTheme 
} from '@mui/material';
import { styled } from '@mui/material/styles';
// import {
//   CheckCircleOutline as SubmittedIcon,
//   HourglassTop as InProgressIcon,
//   AssignmentLate as NotStartedIcon,
//   Verified as ApprovedIcon,
//   Dangerous as NotApprovedIcon,
//   NewReleases as NotAssessedIcon
// } from '@mui/icons-material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import VerifiedIcon from '@mui/icons-material/Verified';
import DangerousIcon from '@mui/icons-material/Dangerous';
import NewReleasesIcon from '@mui/icons-material/NewReleases';

const SubmittedIcon = CheckCircleOutlineIcon;
const InProgressIcon = HourglassTopIcon;
const NotStartedIcon = AssignmentLateIcon;
const ApprovedIcon = VerifiedIcon;
const NotApprovedIcon = DangerousIcon;
const NotAssessedIcon = NewReleasesIcon;

const StatusCard = styled(Card)(({ theme, status, approved }) => ({
  borderLeft: `4px solid ${theme.palette[getStatusColor(status || approved )].main}`,
  transition: 'transform 0.2s, box-shadow 0.2s',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[4]
  }
}));

const getStatusColor = (status) => {
  switch(status) {
    case 'submitted': return 'success';
    case 'in_progress': return 'info';
    case 'not_started': return 'warning';
    case 'approved': return 'success';
    case 'not_approved': return 'warning';
    case 'not_assessed': return 'info';
    case 'not_reviewed': return 'info';
    case 'on_hold': return 'error';
    case 'completed': return 'success';
    default: return 'warning';
  }
};

const StatusIcon = ({ status, approved }) => {
  const theme = useTheme();
  const effectiveStatus = status || approved;
  const color = theme.palette[getStatusColor(effectiveStatus)].main;
  const icons = {
    submitted: <SubmittedIcon sx={{ fontSize: 30, color }} />,
    in_progress: <InProgressIcon sx={{ fontSize: 30, color }} />,
    not_started: <NotStartedIcon sx={{ fontSize: 30, color }} />,
    approved: <ApprovedIcon sx={{ fontSize: 30, color }} />,
    not_approved: <NotApprovedIcon sx={{ fontSize: 30, color }} />,
    not_assessed: <NotAssessedIcon sx={{ fontSize: 30, color }} />,
    not_reviewed: <NotAssessedIcon sx={{ fontSize: 30, color }} />,
    on_hold: <NotAssessedIcon sx={{ fontSize: 30, color }} />,
    completed: <SubmittedIcon sx={{ fontSize: 30, color }} />,
  };
  return icons[effectiveStatus] || icons.not_started;
};

export const DashboardCard = ({ 
  title, 
  value,
  status,
  approved,
  systemId,
  formId
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  // const handleClick = () => {
  //   const basePath = systemId ? `/systems/${systemId}` : '/home';
  //   navigate(`${basePath}/forms-status/${status}`);
  // };

  const handleClick = () => {
    // const basePath = systemId ? `/systems/${systemId}` : '/home';
    // const query = new URLSearchParams({
    //   ...(status && { status }),
    //   ...(approved && { approved })
    // }).toString();
  
    // navigate(`${basePath}/forms-status${query ? `?${query}` : ''}`);
    const query = new URLSearchParams({
      ...(status && { status }),
      ...(approved && { approved })
    }).toString();
  
    if (formId && formId==9) {
      navigate(`/systems/${systemId}/forms/${formId}/response-status${query ? `?${query}` : ''}`);
    } else if (systemId && systemId==2) {
      navigate(`/systems/${systemId}/forms-status${query ? `?${query}` : ''}`);
    }
    // else {
    //   navigate(`/home/forms-status${query ? `?${query}` : ''}`);
    // }    
  };
  
  return (
    <StatusCard 
      status={status}
      approved={approved}
      onClick={handleClick}
      role="button"
      tabIndex="0"
      sx={{
        width: '100%',  
        minWidth: '150px',
        height: '100%',
        mx: 'auto',
        '&:focus-visible': {
          outline: `2px solid ${theme.palette[getStatusColor(status || approved)].main}`
        }
      }}
    >
      <CardContent>
        <Grid container direction="column" spacing={1}>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Grid>
          <Grid item>
            <Grid container alignItems="center" spacing={1}>
              <Grid item>
                <IconButton disableRipple sx={{ p: 0 }}>
                  <StatusIcon status={status} approved={approved} />
                </IconButton>
              </Grid>
              <Grid item xs>
                <Typography variant="h5" component="div">
                  {value}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>

    </StatusCard>
  );
};
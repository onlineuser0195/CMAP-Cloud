import React, { useEffect, useState, useRef } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { DashboardCard } from './DashboardCard';
import { dashboardAPI } from '../api/api';
import { Loading } from './Loading';
import { ErrorAlert } from './ErrorAlert';
import { AnalyticsChart } from './AnalyticsChart';
import { RecentActivityList } from './RecentActivityList';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import VerifiedIcon from '@mui/icons-material/Verified';
import DangerousIcon from '@mui/icons-material/Dangerous';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import { TextField, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export const SystemDashboard = ({ systemId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const printRef = useRef();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const params = {
          systemId,
          ...(fromDate && { fromDate }),
          ...(toDate && { toDate })
        };
        const response = await dashboardAPI.getSystemOverview(params);
        console.log(response);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [systemId, fromDate, toDate]);

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
  
    // Collect all external stylesheets and inline styles
    let externalStyles = '';
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          externalStyles += rule.cssText;
        }
      } catch (e) {
        // CORS-protected stylesheets will throw — skip them
      }
    }
  
    // Open a new window and write printable content
    const newWindow = window.open('', '', 'width=900,height=700');
  
    newWindow.document.write(`
      <html>
        <head>
          <title>System Overview</title>
          <style>
            ${externalStyles}
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
  
    // Wait for new window to fully render before printing
    newWindow.document.close();

      // ✅ Extra fallback (if onload doesn't trigger)
    setTimeout(() => {
      if (newWindow) {
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      }
    }, 500);
  };

  

  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Grid>
            <Box display="flex" justifyContent="center" gap={2} mb={3}>
<LocalizationProvider dateAdapter={AdapterDateFns}>
  <DatePicker
    label="From Date"
    value={fromDate}
    onChange={(newValue) => setFromDate(newValue)}
    slotProps={{
      textField: {
        error: false,
        size: 'small',
        sx: {
          '& .MuiInputBase-root': {
            height: '40px',  // Recommended min-height for usability
            fontSize: '0.875rem'
          },
          width: '170px'
        }
      }
    }}
  />
  <DatePicker
    label="To Date"
    value={toDate}
    onChange={(newValue) => setToDate(newValue)}
    slotProps={{
      textField: {
        error: false,
        size: 'small',
        sx: {
          '& .MuiInputBase-root': {
            height: '40px',
            fontSize: '0.875rem'
          },
          width: '170px'
        }
      }
    }}
  />
</LocalizationProvider>
  {/* <TextField
    label="From Date"
    type="date"
    size="small"
    InputLabelProps={{ shrink: true }}
    slotProps={{
      input: {
        sx: {
          '&::-webkit-calendar-picker-indicator': {
            opacity: 1,
            display: 'block',
            WebkitAppearance: 'auto',
            cursor: 'pointer',
            margin: 0
          }
        }
      }
    }}
    value={fromDate}
    onChange={e => setFromDate(e.target.value)}
  />
  <TextField
    label="To Date"
    type="date"
    size="small"
    InputLabelProps={{ shrink: true }}
    value={toDate}
    onChange={e => setToDate(e.target.value)}
  /> */}
  <Button
  variant="outlined"
  size="small"
  // sx={{ alignSelf: 'center', height: '40px' }}
  onClick={() => {
    setFromDate('');
    setToDate('');
  }}
>
  Clear Filters
</Button>
<Tooltip title="Print Overview">
  <IconButton
    className="no-print"
    onClick={handlePrint}
    color="primary"
    size="small"
  >
    <PrintIcon />
  </IconButton>
</Tooltip>
</Box>
    <Grid container spacing={3} marginLeft={'5%'} ref={printRef} >
      {/* Column 1: User Progress */}
      <Box display="flex" justifyContent="center" sx={{width: '34%' }}>
      <Grid item xs={12} md={4}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Submission Progress
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <DashboardCard
              title="Not Started"
              value={data.formStatus.not_started || 0}
              icon={AssignmentLateIcon}
              color="warning"
              status="not_started"
              systemId={systemId}
            />
          </Grid>
          <Grid item xs={4}>
            <DashboardCard
              title="In Progress"
              value={data.formStatus.in_progress || 0}
              icon={HourglassTopIcon}
              color="info"
              status="in_progress"
              systemId={systemId}
            />
          </Grid>
          <Grid item xs={4}>
            <DashboardCard
              title="Submitted"
              value={data.formStatus.submitted || 0}
              icon={CheckCircleOutlineIcon}
              color="success"
              status="submitted"
              systemId={systemId}
            />
          </Grid>
        </Grid>
        <Box mt={2} display="flex" justifyContent="center" sx={{width: '100%' }}>
        <AnalyticsChart
            title="Submission Progress Chart"
            height={400} // adjust as needed
            data={[
              { name: 'Not Started', value: data.formStatus?.not_started || 0 },
              { name: 'In Progress', value: data.formStatus?.in_progress || 0 },
              { name: 'Submitted', value: data.formStatus?.submitted || 0 }
            ]}
          />
        </Box>
      </Grid>
      </Box>

      {/* Column 2: Supervisor Approval */}
      <Box display="flex" justifyContent="center" sx={{width: '34%' }}>
      <Grid item xs={12} md={4}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Approval Status
        </Typography>
        <Grid container spacing={1}>
        <Grid item xs={4}>
            <DashboardCard
              title="Not Reviewed"
              value={data.approvalStatus.not_assessed || 0}
              icon={NewReleasesIcon}
              color="info"
              approved="not_assessed"
              systemId={systemId}
            />
          </Grid>
          <Grid item xs={4}>
            <DashboardCard
              title="Not Approved"
              value={data.approvalStatus.not_approved || 0}
              icon={DangerousIcon}
              color="warning"
              approved="not_approved"
              systemId={systemId}
            />
          </Grid>
          <Grid item xs={4}>
            <DashboardCard
              title="Approved"
              value={data.approvalStatus.approved || 0}
              icon={VerifiedIcon}
              color="success"
              approved="approved"
              systemId={systemId}
            />
          </Grid>
        </Grid>
        <Box mt={2} display="flex" justifyContent="center" sx={{width: '100%' }}>
          <AnalyticsChart
            title="Approval Status Chart"
            height={400} // adjust as needed
            data={[
              { name: 'Approved', value: data.approvalStatus?.approved || 0 },
              { name: 'Not Approved', value: data.approvalStatus?.not_approved || 0 },
              { name: 'Not Reviewed', value: data.approvalStatus?.not_assessed || 0 },
            ]}
          />
        </Box>
      </Grid>
      </Box>

      {/* Column 3: Recent Activity */}
      <Grid item xs={12} md={4}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Recent Activity
        </Typography>
        <Box>
          <RecentActivityList activities={data.recentActivity} />
        </Box>
      </Grid>
    </Grid>
    </Grid>
  );
};
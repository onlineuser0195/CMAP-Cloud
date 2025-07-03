import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { dashboardAPI, formResponseAPI, formAPI, systemAPI } from '../api/api';
import { Grid, Box, Typography, Tabs, Tab, Chip, Button } from '@mui/material';
import { DashboardCard } from '../components/DashboardCard';
import { RecentActivityList } from '../components/RecentActivityList';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { Loading } from '../components/Loading';
import { ErrorAlert } from '../components/ErrorAlert';
import BackButton from '../components/buttons/BackButton';
import ExcelImportButton from '../components/buttons/ExcelImportButton';
import { USER_ROLES, TRIMMED_ID } from '../constants/constants';
import useAuth from '../hooks/AuthContext';
import PrintIcon from '@mui/icons-material/Print';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import VerifiedIcon from '@mui/icons-material/Verified';
import DangerousIcon from '@mui/icons-material/Dangerous';
import NewReleasesIcon from '@mui/icons-material/NewReleases';

const FormDashboard = () => {
  const { userRole } = useAuth(); 
  const { formId } = useParams();
  const location = useLocation();
  const systemId = location.state?.systemId;
  const navigate = useNavigate();

  const [formName, setFormName] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemName, setSystemName] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Single, 2: Grouped
  const [expandedGroups, setExpandedGroups] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');

  const printRef = useRef();

  // Group responses by group_id
  const groupedResponses = responses.reduce((acc, response) => {
    if (response.group_id) {
      if (!acc[response.group_id]) {
        acc[response.group_id] = [];
      }
      acc[response.group_id].push(response);
    }
    return acc;
  }, {});

  // Filter responses based on active tab
  const filteredResponses = () => {
    switch (activeTab) {
      case 0: // All
        return responses;
      case 1: // Single
        return responses.filter(response => !response.group_id);
      case 2: // Grouped
        return Object.entries(groupedResponses).map(([groupId, groupResponses]) => {
          const approvedCount = groupResponses.filter(r => r.approved === 'true').length;
          const notApprovedCount = groupResponses.filter(r => r.approved === 'false').length;
          const notAssessedCount = groupResponses.length - approvedCount - notApprovedCount;
          return {
            _id: groupId,
            isGroup: true,
            count: groupResponses.length,
            createdAt: groupResponses[0].createdAt,
            updatedAt: groupResponses[0].updatedAt, // Use first response's date
            progress: groupResponses[0].progress,  // Use first response's status
            counts: { notAssessed: notAssessedCount, approved: approvedCount, notApproved: notApprovedCount },
          };
        });
      default:
        return responses;
    }
  };

  // New helper: 
  const applySearchAndSort = list => {
    const term = searchTerm.toLowerCase();

    // 1) search
    const filtered = list.filter(item => {
      const vid = item.display_id?.toLowerCase() || '';
      const gid = item._id.toLowerCase();
      return vid.includes(term) || gid.includes(term);
    });

    // 2) sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          // fallback to updatedAt if createdAt missing (e.g. group items)
          return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt);
        case 'updatedAt':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'visitorId':
          return (a.display_id || '').localeCompare(b.display_id || '');
        case 'groupId':
          return a._id.localeCompare(b._id);
        default:
          return 0;
      }
    });
  };


  const itemsPerPage = 5;
  const paginatedResponses = () => {
    const processed = applySearchAndSort(filteredResponses());
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processed.slice(startIndex, endIndex);
  };
  
  const totalPages = Math.ceil(filteredResponses().length / itemsPerPage);

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
  

  const statusColors = {
    submitted: 'success',
    in_progress: 'info',
    not_started: 'warning',
    approved: 'success',
    not_approved: 'warning',
    not_assessed: 'info',
    not_reviewed: 'info',
    true: 'success',
    false: 'warning',
  };
  
  // Output: "18/04/2025, 19:52"
  
  const generateObjectId = () => {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    const random = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
    return timestamp + random;
  };

  const handleNewResponse = () => {
    navigate(`/form-details/${formId}`, {
      state: {
        ...(systemId && { systemId }),
        respId: generateObjectId()
      }
    });
  };

  const handleImportComplete = async (importedResponses) => {
    console.log('Imported responses:', importedResponses);
    try {
      // Refresh the data
      await fetchData();
    } catch (error) {
      console.error('Error refreshing after import:', error);
      alert('Import completed but failed to refresh data');
    }
  };

  const fetchData = async () => {
    try {
      const [overviewRes, formDetailsRes, responseList] = await Promise.all([
        dashboardAPI.getFormOverview(formId),
        formAPI.getFormDetails(formId),
        formResponseAPI.getFormResponses(formId, systemId)
      ]);

      setDashboardData(overviewRes.data);
      setFormName(formDetailsRes.data.name);
      setResponses(responseList);
      console.log(responseList);
      console.log(overviewRes);
    } catch (err) {
      console.error('Failed to fetch form dashboard data:', err);
      setError('Something went wrong loading the form dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, isGroup) => {
    const ok = window.confirm(
      isGroup
        ? 'Delete all responses in this group?'
        : 'Delete this single response?'
    );
    if (!ok) return;
  
    try {
      // positional args: formId, systemId, respId, groupId
      await formResponseAPI.deleteResponse(
        formId,
        systemId,
        isGroup ? null : id,
        isGroup ? id : null
      );
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    fetchData();
  }, [formId, systemId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setCurrentPage(1);
  };

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

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div style={{ paddingTop: '20px' }}>
      <BackButton label="System" />
      <br /><br/>
      <div className='text-center'>
      <Typography variant="h4" align="center" gutterBottom>
       {formName} - Dashboard
      </Typography>
      <small className="text-muted">
        System: <strong>{systemName}</strong>
      </small>
      </div>
      {userRole===USER_ROLES.APP_USER && (<Box display="flex" justifyContent="center" marginY={2}>
        <Button variant="contained" onClick={handleNewResponse}>
          + Start New Response
        </Button>
        { formId==9 && 
        <ExcelImportButton 
            formId={formId} // Pass the current form ID
            systemId={systemId} // Pass system ID if needed
            onImportComplete={handleImportComplete}
        />}
      </Box>)}
      {/* Tabs for response views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Show All" />
          <Tab label="Single Responses" />
          <Tab label="Group Responses" />
        </Tabs>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={2}>
        <input
          type="text"
          placeholder="Search by Visitor ID or Group ID"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{ padding: '8px', width: '40%' }}
        />

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="updatedAt">Sort by Last Modified</option>
          <option value="createdAt">Sort by Create Date</option>
          <option value="visitorId">Sort by Visitor ID</option>
          <option value="groupId">Sort by Group ID</option>
        </select>
      </Box>

      {/* Response List */}
      <Box mt={5}>
        <Typography variant="h6" className="my-4 text-center">
          {activeTab === 0 && `All Responses for ${formName}`}
          {activeTab === 1 && `Single Responses for ${formName}`}
          {activeTab === 2 && `Grouped Responses for ${formName}`}
        </Typography>
        <Box display="flex" justifyContent="center" alignItems="center" mb={1}>
          <Button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            &lt; Prev
          </Button>

          {[...Array(totalPages)].map((_, index) => (
            <Button 
              key={index}
              size="small"
              variant={currentPage === index + 1 ? 'contained' : 'outlined'}
              onClick={() => setCurrentPage(index + 1)}
              style={{ margin: '0 3px', minWidth: '30px', padding: '4px 8px' }}
            >
              {index + 1}
            </Button>
          ))}

          <Button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next &gt;
          </Button>
        </Box>
        <ol className="list-group list-group-numbered" style={{ padding: '5px' }}>
          {paginatedResponses().map(item => (
            <React.Fragment key={item._id}>
            <li
              key={item._id}
              className="list-group-item d-flex align-items-center"
            >
              <span>
                {item.isGroup ? (
                  <>
                    &nbsp;Group: <strong>{item._id}</strong> ({item.count} responses),
                  </>
                ) : (
                  <>
                    &nbsp;Visitor ID: <strong> {item.display_id?.slice(-TRIMMED_ID)}</strong>,
                  </>
                )}
                &nbsp;updated at: <strong> {new Date(item.updatedAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}</strong>
              </span>
              
              <Box display="flex" alignItems="center" gap={2} sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
                  <i
                  className="fa-regular fa-circle-xmark text-danger"
                  style={{ cursor: 'pointer' }}
                  title={
                    item.isGroup
                      ? 'Delete Group Response'
                      : 'Delete Single Response'
                  }
                  onClick={() => handleDelete(item._id, Boolean(item.isGroup))}
                />
                <Chip
                  label={item.progress?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not Started'}
                  color={statusColors[item.progress] || 'default'}
                  size="small"
                />
                {item.isGroup ? (
                <>
                  <Chip
                    label={`${item.counts.notAssessed} Not Reviewed`}
                    color={statusColors['not_assessed']}
                    size="small"
                  />
                  <Chip
                    label={`${item.counts.approved} Approved`}
                    color={statusColors['true']}
                    size="small"
                  />
                  <Chip
                    label={`${item.counts.notApproved} Not Approved`}
                    color={statusColors['false']}
                    size="small"
                  />
                </>):
                (<Chip
                  label={
                    item.approved === 'true'
                      ? 'Approved'
                      : item.approved === 'false'
                      ? 'Not Approved'
                      : item.approved?.replace('_', ' ') || 'Not Reviewed'
                  }              
                  color={statusColors[item.approved] || 'info'}
                  size="small"
                />)}
                {item.isGroup ? (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => toggleGroup(item._id)}
                  >
                    {expandedGroups[item._id] ? 'Hide Responses' : 'Show Responses'}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => 
                      navigate(`/form-details/${formId}`, {
                        state: {
                          ...(systemId && { systemId }),
                          respId: item._id,
                          ...(item.group_id && { groupId: item.group_id }) // Pass groupId if exists
                        }
                      })
                    }
                  >
                    View/Edit
                  </Button>
                )}
              </Box>
            </li>

            {/* Group responses sublist */}
            {item.isGroup && expandedGroups[item._id] && (
              <div style={{ paddingLeft: '30px', backgroundColor: '#f8f9fa' }}>
                {groupedResponses[item._id].map(response => (
                  <li
                    key={response._id}
                    className="list-group-item d-flex align-items-center"
                    style={{ borderLeft: '3px solid #0d6efd' }}
                  >
                    <span>
                      &nbsp;Visitor ID: <strong>{response.display_id?.slice(-TRIMMED_ID)}</strong>,
                      &nbsp;updated at: <strong> {new Date(response.updatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}</strong>
                    </span>
                    <Box display="flex" alignItems="center" gap={2} sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
                    <i
                      className="fa-regular fa-circle-xmark text-danger"
                      style={{ cursor: 'pointer' }}
                      title='Delete Single Response'
                      onClick={() => handleDelete(response._id, false)}
                    />
                      <Chip
                        label={response.progress?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not Started'}
                        color={statusColors[response.progress] || 'default'}
                        size="small"
                      />
                      <Chip
                        label={
                          response.approved === 'true'
                            ? 'Approved'
                            : response.approved === 'false'
                            ? 'Not Approved'
                            : response.approved?.replace('_', ' ') || 'Not Reviewed'
                        }              
                        color={statusColors[response.approved] || 'info'}
                        size="small"
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          navigate(`/form-details/${formId}`, {
                            state: {
                              ...(systemId && { systemId }),
                              respId: response._id,
                              groupId: item._id 
                            }
                          })
                        }
                      >
                        View/Edit
                      </Button>
                    </Box>
                  </li>
                ))}
              </div>
            )}
          </React.Fragment>
          ))}
        </ol>
      </Box>

      <Box display="flex" justifyContent="right" gap={2} mb={2} mr={2}>
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

      {/* DASHBOARD CARDS */}
      <Grid container spacing={3} marginLeft={'5%'} ref={printRef}>
        {/* Progress */}
        <Box display="flex" justifyContent="center" sx={{ width: '34%' }}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Submission Progress
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <DashboardCard
                  title="Not Started"
                  value={dashboardData.formStatus.not_started || 0}
                  icon={AssignmentLateIcon}
                  color="warning"
                  status="not_started"    
                  formId={formId}   
                  systemId={systemId}            
                />
              </Grid>
              <Grid item xs={4}>
                <DashboardCard
                  title="In Progress"
                  value={dashboardData.formStatus.in_progress || 0}
                  icon={HourglassTopIcon}
                  color="info"
                  status="in_progress"
                  formId={formId}     
                  systemId={systemId} 
                />
              </Grid>
              <Grid item xs={4}>
                <DashboardCard
                  title="Submitted"
                  value={dashboardData.formStatus.submitted || 0}
                  icon={CheckCircleOutlineIcon}
                  color="success"
                  status="submitted"
                  formId={formId} 
                  systemId={systemId}              
                />
              </Grid>
            </Grid>
            <Box mt={2}>
              <AnalyticsChart
                title="Progress Chart"
                height={400}
                data={[
                  { name: 'Not Started', value: dashboardData.formStatus?.not_started || 0 },
                  { name: 'In Progress', value: dashboardData.formStatus?.in_progress || 0 },
                  { name: 'Submitted', value: dashboardData.formStatus?.submitted || 0 }
                ]}
              />
            </Box>
          </Grid>
        </Box>

        {/* Approval */}
        <Box display="flex" justifyContent="center" sx={{ width: '34%' }}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Approval Status
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <DashboardCard
                  title="Not Reviewed"
                  value={dashboardData.approvalStatus.not_assessed || 0}
                  icon={NewReleasesIcon}
                  color="info"
                  approved="not_assessed"
                  formId={formId}
                  systemId={systemId} 
                />
              </Grid>
              <Grid item xs={4}>
                <DashboardCard
                  title="Not Approved"
                  value={dashboardData.approvalStatus.not_approved || 0}
                  icon={DangerousIcon}
                  color="warning"
                  approved="not_approved"
                  formId={formId}
                  systemId={systemId} 
                />
              </Grid>
              <Grid item xs={4}>
                <DashboardCard
                  title="Approved"
                  value={dashboardData.approvalStatus.approved || 0}
                  icon={VerifiedIcon}
                  color="success"
                  approved="approved"
                  formId={formId}
                  systemId={systemId} 
                />
              </Grid>
            </Grid>
            <Box mt={2}>
              <AnalyticsChart
                title="Approval Status Chart"
                height={400}
                data={[
                  { name: 'Approved', value: dashboardData.approvalStatus?.approved || 0 },
                  { name: 'Not Approved', value: dashboardData.approvalStatus?.not_approved || 0 },
                  { name: 'Not Reviewed', value: dashboardData.approvalStatus?.not_assessed || 0 }
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
            <RecentActivityList activities={dashboardData.recentActivity} />
          </Box>
        </Grid>
      </Grid>
    </div>
  );
};

export default FormDashboard;

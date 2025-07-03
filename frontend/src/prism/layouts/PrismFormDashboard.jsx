// src/layouts/FormDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Grid, Box, Typography, Tabs, Tab, Button, TextField, Paper, Tooltip, IconButton, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import RuleIcon from '@mui/icons-material/Rule';
import ClearIcon from '@mui/icons-material/Clear';
import { dashboardAPI, formResponseAPI, formAPI, systemAPI } from '../../api/api';
import { DashboardCard } from '../../components/DashboardCard';
import { RecentActivityList } from '../../components/RecentActivityList';
import { AnalyticsChart } from '../../components/AnalyticsChart';
import { Loading } from '../../components/Loading';
import { ErrorAlert } from '../../components/ErrorAlert';
import BackButton from '../../components/buttons/BackButton';
import ExcelImportButton from '../../components/buttons/ExcelImportButton';
import useAuth from '../../hooks/AuthContext';
import { USER_ROLES, TRIMMED_ID, PRISM_FIELD_MAPPING } from '../../constants/constants';
import SearchIcon from '@mui/icons-material/Search';
import { POAPI } from '../api/api';
import GanttChart from '../components/GanttChart';

const FormDashboard = () => {
  const { userRole, mappedRole, userId } = useAuth();
  const { formId } = useParams();
  const location = useLocation();
  const systemId = location.state?.systemId;
  const navigate = useNavigate();

  const [formName, setFormName] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [ganttData, setGanttData] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemName, setSystemName] = useState('');
  const [activeTab, setActiveTab] = useState(1);   // 0=All,1=Single,2=Grouped
  const [searchTerm, setSearchTerm] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [sortModel, setSortModel] = useState([
    {
      field: mappedRole === USER_ROLES.APP_USER? 'updatedAt': 'submittedAt',
      sort: 'desc',
    },
  ]);
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null
  });
  const printRef = useRef();

  const statusColors = {
    'Completed': 'success',
    'In Progress': 'info',
    'Not Started': 'warning',
    'On Hold': 'error',
  };

  // Fetch system name
  useEffect(() => {
    if (!systemId) return;
    systemAPI.getSystemDetails(systemId)
      .then(res => setSystemName(res.data.name))
      .catch(() => setError('Failed to load system details'));
  }, [systemId]);

  // Fetch overview, form details, responses
  const fetchData = async () => {
    try {
      const [ov, formRes, respList, chartData] = await Promise.all([
        POAPI.getProjectStatusCount(mappedRole, userId),
        formAPI.getFormDetails(formId),
        formResponseAPI.getFormResponses(formId, systemId, null, mappedRole, userId),
        POAPI.getProjectDataForGantt(mappedRole, userId)
        //formResponseAPI.getFormResponses(formId, systemId, null, mappedRole, userId),
      ]);
      setDashboardData(ov);
      setFormName(formRes.data.name);
      setResponses(respList);
      setGanttData(chartData);
    } catch (e) {
      console.error(e);
      setError('Something went wrong loading the form dashboard.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, [formId, systemId]);

  // Group by group_id
  const grouped = responses.reduce((acc, r) => {
    if (r.group_id) {
      (acc[r.group_id] ||= []).push(r);
    }
    return acc;
  }, {});

  // Filter per tab
  // const filteredList = () => {
  //   if (activeTab === 1) {
  //     // Single
  //     return responses.map(r => ({ ...r, isGroup: false }));
  //   }
  //   if (activeTab === 2) {
  //     // Group summaries
  //     return Object.entries(grouped).map(([gid, grp]) => {
  //       const approved = grp.filter(r => r.approved === 'true').length;
  //       const notApproved = grp.filter(r => r.approved === 'false').length;
  //       const notAssessed = grp.length - approved - notApproved;
  //       return {
  //         _id: gid,
  //         isGroup: true,
  //         count: grp.length,
  //         updatedAt: grp[0].updatedAt,
  //         progress: grp[0].progress,
  //         counts: { notAssessed, approved, notApproved },
  //       };
  //     });
  //   }
  //   // All: mix singles + group summaries
  //   const singles = responses.map(r => ({ ...r, isGroup: false }));
  //   const groups  = Object.entries(grouped).map(([gid, grp]) => {
  //     const approved = grp.filter(r => r.approved === 'true').length;
  //     const notApproved = grp.filter(r => r.approved === 'false').length;
  //     const notAssessed = grp.length - approved - notApproved;
  //     return {
  //       _id: gid,
  //       isGroup: true,
  //       count: grp.length,
  //       updatedAt: grp[0].updatedAt,
  //       progress: grp[0].progress,
  //       counts: { notAssessed, approved, notApproved },
  //     };
  //   });
  //   return [...singles, ...groups];
  // };

  const filteredList = () => {
    if (activeTab === 2) {
      // Single Responses Only (no group_id)
      return responses.filter(r => !r.group_id).map(r => ({ ...r, isGroup: false }));
    }
  
    if (activeTab === 3) {
      // Grouped Tab: only group summaries
      return Object.entries(grouped).map(([gid, grp]) => {
        const approved = grp.filter(r => r.approved === 'true').length;
        const notApproved = grp.filter(r => r.approved === 'false').length;
        const notAssessed = grp.length - approved - notApproved;
        return {
          _id: gid,
          isGroup: true,
          count: grp.length,
          updatedAt: grp[0].updatedAt,
          createdAt:  grp[0].createdAt,
          submittedAt: grp[0].submittedAt,
          progress: grp[0].progress,
          approved: grp[0].approved,
          // counts: { notAssessed, approved, notApproved },
        };
      });
    }
  
    // "All" Tab: ungrouped responses + group summaries ONLY
    const singles = responses
      .filter(r => !r.group_id)
      .map(r => ({ ...r, isGroup: false, count: '1' }));
  
    const groups = Object.entries(grouped).map(([gid, grp]) => {
      const approved = grp.filter(r => r.approved === 'true').length;
      const notApproved = grp.filter(r => r.approved === 'false').length;
      const notAssessed = grp.length - approved - notApproved;
      return {
        _id: gid,
        isGroup: true,
        count: grp.length,
        updatedAt: grp[0].updatedAt,
        createdAt: grp[0].createdAt,
        submittedAt: grp[0].submittedAt,
        progress: grp[0].progress,
        counts: { notAssessed, approved, notApproved },
      };
    });
  
    return [...singles, ...groups];
  };
  

  // Map to DataGrid rows
  const baseRows = filteredList().map(item => {
    if (item.isGroup) {
      //if display ids are different for all responses
      // const visitorIds = grouped[item.id || item._id]?.map(r => r.display_id?.slice(-TRIMMED_ID)).join(', ') || '';
      
      const groupResponses = grouped[item.id || item._id];
      const groupDisplayId = groupResponses?.[0]?.display_id?.slice(-TRIMMED_ID) || '';

      return {
        id: item._id,
        visitorId: groupDisplayId,
        groupId: item._id,
        count: item.count,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
        submittedAt: item.submittedAt,
        progress: item.progress,
        approved: item.approved,
        fields: item.fields,
        // counts: item.counts,
        isGroup: true,
      };
    }
    return {
      id: item._id,
      visitorId: item.display_id?.slice(-TRIMMED_ID) || '',
      groupId: 'Single',
      count: '',
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
      submittedAt: item.submittedAt,
      progress: item.progress,
      approved: item.approved,
      isGroup: false,
      fields: item.fields,
      projectType: item.fields[PRISM_FIELD_MAPPING.projectType],
      projectName: item.fields[PRISM_FIELD_MAPPING.projectName],
      projectStatus: item.fields[PRISM_FIELD_MAPPING.projectStatus],
      plannedStartDate: item.fields[PRISM_FIELD_MAPPING.plannedStartDate],
      plannedEndDate: item.fields[PRISM_FIELD_MAPPING.plannedEndDate],
    };
  });

  // Quick text search
  const rows = baseRows.filter(r => {
    const t = searchTerm.toLowerCase();
    // Date filtering
    const rowDate = new Date(r.updatedAt);
    const dateInRange = 
      (!dateRange.from || rowDate >= new Date(dateRange.from)) &&
      (!dateRange.to || rowDate <= new Date(dateRange.to));
      // Progress filter
    const projectStatusMatch = 
      projectStatusFilter === 'all' || 
      r.fields?.[PRISM_FIELD_MAPPING.projectStatus] === projectStatusFilter;

    // Approval filter
    const approvalMatch = 
      approvalFilter === 'all' || 
      (approvalFilter === 'not_assessed' && (!r.approved || r.approved === '')) ||
      (approvalFilter === 'approved' && r.approved === 'true') ||
      (approvalFilter === 'not_approved' && r.approved === 'false');
    return (
      dateInRange && projectStatusMatch && approvalMatch && (
        r.visitorId.toLowerCase().includes(t) ||
        r.groupId.toLowerCase().includes(t)
      )
    );
  });

  // DataGrid columns
  const columns = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 50,
      sortable: false,
      renderCell: (params) => (
        params.api.getSortedRowIds().indexOf(params.id) + 1
      ),
    },
    {
      field: 'visitorId',
      headerName: 'Project ID',
      width: 100,
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: 'projectName',
      headerName: 'Project Name',
      width: 150,
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: 'projectType',
      headerName: 'Project Type',
      width: 175,
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: 'plannedStartDate',
      headerName: 'Planned Start Date',
      width: 150,
      renderCell: (params) => <span>{params.value || '-'}</span>,
    },
    {
      field: 'plannedEndDate',
      headerName: 'Planned End Date',
      width: 145,
      renderCell: (params) => <span>{params.value || '-'}</span>,
    },
    {
      field: 'projectStatus',
      headerName: 'Project Status',
      width: 150,
      sortable: false,
      renderCell: params => (
        <Chip
          label={params.value || '-'}
          color={statusColors[params.value] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      sortable: false,
      renderCell: params => (
        <Box >
          <IconButton
            size="small"
            sx={{ marginRight: '20px' }}
            onClick={() => {
              const ok = window.confirm(
                params.row.isGroup
                  ? 'Delete all responses in this group?'
                  : 'Delete this single response?'
              );
              if (!ok) return;
              const respId  = params.row.isGroup ? null : params.row.id;
              const groupId = params.row.isGroup ? params.row.id : null;
              formResponseAPI
                .deleteResponse(formId, systemId, respId, groupId)
                .then(fetchData)
                .catch(err => alert(err.response?.data?.message || err.message));
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
  
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              // const state = { respId: params.row.id };
              // if (systemId) state.systemId = systemId;
              // if (params.row.isGroup) state.groupId = params.row.id;
              // navigate(`/form-details/${formId}`, { state });
              var url = `/systems/${systemId}/prism-form/${formId}/response/${params.row.id}`
              navigate(url);
            }}
          >
            <i className="fas fa-eye me-2"></i>View/Edit<i className="fas fa-pen m-2"></i>
          </Button>
        </Box>
      ),
    },
  ];
  

  // Handlers
  const handleTabChange = (_, v) => {
    setActiveTab(v);
    setSearchTerm('');
  };
  const handleNew = () => {
    const respId = 
      Math.floor(Date.now()/1000).toString(16) +
      'xxxxxxxxxxxxxxxx'.replace(/x/g, () =>
        Math.floor(Math.random()*16).toString(16)
      );
    // navigate(`/form-details/${formId}`, {
    //   state: { ...(systemId && { systemId }), respId }
    // });
    const url = `/systems/${systemId}/prism-form/${formId}/response/${respId}`;
    navigate(url)
  };
  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    let styles = '';
    Array.from(document.styleSheets).forEach(sheet => {
      try { Array.from(sheet.cssRules).forEach(r => styles += r.cssText); }
      catch {}
    });
    const w = window.open('', '', 'width=900,height=700');
    w.document.write(`<html><head><style>${styles}</style></head><body>${content}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  if (loading) return <Loading />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div style={{ paddingTop: 20 }}>
      <BackButton label="Home" />

      <Box textAlign="center" mb={3}>
        <Typography variant="h4">{formName}</Typography>
        {/* <Typography variant="body2">
          System: <strong>{systemName}</strong>
        </Typography> */}
      </Box>
      {mappedRole === USER_ROLES.PROJECT_MANAGER && (
        <Box display="flex" justifyContent="center" mb={2} gap={2}>
          <Button variant="contained" onClick={handleNew}>
            <i className="fa-solid fa-circle-plus me-2"></i>
            Start New Project
          </Button>
          {formId == 9 && (
            <ExcelImportButton
              formId={formId}
              systemId={systemId}
              onImportComplete={fetchData}
            />
          )}
        </Box>
      )}

      {/* Search */}
      <Box px={2} mb={2} ml={2} display="flex" gap={2}>
        <TextField
          sx={{width:"25%", backgroundColor: 'white'}} 
          size="small"
          // fullWidth
          placeholder="Search by Project ID"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        {/* Progress Filter */}
        <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white' }}>
          <InputLabel>Project Status</InputLabel>
          <Select
            value={projectStatusFilter}
            onChange={(e) => setProjectStatusFilter(e.target.value)}
            label="Project Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Not Started">Not Started</MenuItem>
            <MenuItem value="On Hold">On Hold</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
        </FormControl>


        <LocalizationProvider dateAdapter={AdapterDateFns} >
          <DatePicker
            label="From Date"
            slotProps={{ 
              textField: { 
                size: 'small',
              } 
            }}
            sx={{ width: 190, backgroundColor: 'white' }}
            value={dateRange.from}
            onChange={(newValue) => setDateRange({...dateRange, from: newValue})}
            renderInput={(params) => <TextField {...params} size="small"  sx={{ 
              '& .MuiInputBase-root': { 
                height: '10px', // Match your TextField height
                fontSize: "10px"
              }
            }}/>}
          />
          <DatePicker
            label="To Date"
            slotProps={{ 
              textField: { 
                size: 'small',
              } 
            }}
            sx={{ width: 190, backgroundColor: 'white' }}
            value={dateRange.to}
            onChange={(newValue) => setDateRange({...dateRange, to: newValue})}
            renderInput={(params) => <TextField {...params} size="small"  sx={{ 
              '& .MuiInputBase-root': { 
                height: '10px',
                fontSize: "10px" // Match your TextField height
              }
            }}/>}
          />
        </LocalizationProvider>
        <Button
          size="small"
          startIcon={<ClearIcon />}
          onClick={() => {
            setSearchTerm('');
            setProjectStatusFilter('all');
            setApprovalFilter('all');
            setDateRange({ from: null, to: null });
          }}
          sx={{
            height: 40,
            whiteSpace: 'nowrap'
          }}
          disabled={
            !searchTerm && 
            projectStatusFilter === 'all' && 
            approvalFilter === 'all' && 
            !dateRange.from && 
            !dateRange.to
          }
        >
          Clear
        </Button>
      </Box>

      {/* DataGrid */}
      <Paper elevation={1} sx={{ width: '95%', margin: '0 auto', border: '1px black solid' }}>
        <DataGrid
          sx={{
            padding: '10px',
            // keep the outer header bar transparent
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'transparent',
            },
            // style each header cell
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: 'black',
              // remove any cell borders if you want a solid bar
              borderRight: '1px solid #333',
            },
            // make the title text & sort icons white
            '& .MuiDataGrid-columnHeaderTitle, & .MuiDataGrid-sortIcon': {
              color: 'white',
            },
            // for the extra space after columns end in the header row
            '& .MuiDataGrid-columnHeaders div[role="row"]': {
              backgroundColor: 'black',      // black bar
            },
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 5, page: 0 },
            },
          }}
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          pagination
          disableSelectionOnClick
          autoHeight
          sortModel={sortModel}
          onSortModelChange={(newSortModel) => setSortModel(newSortModel)}
        />
      </Paper>

      {/* Print */}
      {/* <Box display="flex" justifyContent="flex-end" my={2} mr={2}>
        <Tooltip title="Print Overview">
          <IconButton onClick={handlePrint} size="small">
            <PrintIcon />
          </IconButton>
        </Tooltip>
      </Box> */}

      {/* Dashboard Cards & Charts */}
      <Grid container spacing={3} display="flex" justifyContent="space-evenly" marginLeft="1%" marginBottom="2%" marginTop="2%" ref={printRef}>
        {/* Submission Progress */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Project Status
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <DashboardCard
                title="Not Started"
                value={dashboardData["Not Started"] || 0}
                color='warning'
                status="not_started"    
                formId={formId}   
                systemId={systemId}      
              />
            </Grid>
            <Grid item xs={4}>
              <DashboardCard
                title="On Hold"
                value={dashboardData["On Hold"] || 0}
                color="info"
                status="on_hold"    
                formId={formId}   
                systemId={systemId}   
              />
            </Grid>
            <Grid item xs={4}>
              <DashboardCard
                title="In Progress"
                value={dashboardData["In Progress"] || 0}
                color="secondary"
                status="in_progress"    
                formId={formId}   
                systemId={systemId}   
              />
            </Grid>
            <Grid item xs={4}>
              <DashboardCard
                title="Completed"
                value={dashboardData["Completed"] || 0}
                color="success"
                status="completed"    
                formId={formId}   
                systemId={systemId}   
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div id='gantt'>
            <Typography variant="h6" gutterBottom>
              Project Timeline (Planned vs Actual Date)
            </Typography>
            <GanttChart rawTasks={ganttData} />
        </div>
      </div>
    </div>
  );
};

export default FormDashboard;

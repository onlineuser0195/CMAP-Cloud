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
import { dashboardAPI, formResponseAPI, formAPI, systemAPI } from '../api/api';
import { DashboardCard } from '../components/DashboardCard';
import { RecentActivityList } from '../components/RecentActivityList';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { Loading } from '../components/Loading';
import { ErrorAlert } from '../components/ErrorAlert';
import BackButton from '../components/buttons/BackButton';
import ExcelImportButton from '../components/buttons/ExcelImportButton';
import useAuth from '../hooks/AuthContext';
import { USER_ROLES, TRIMMED_ID } from '../constants/constants';
import EmbassyUserStepper from '../components/stepper/EmbassyUserStepper';
import ApproverStepper from '../components/stepper/ApproverStepper';
import SearchIcon from '@mui/icons-material/Search';
import * as XLSX from 'xlsx';

const FormDashboard = () => {
  const { userRole, mappedRole } = useAuth();
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
  const [activeTab, setActiveTab] = useState(1);   // 0=All,1=Single,2=Grouped
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState('all');
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
    submitted: 'success',
    in_progress: 'warning',
    not_started: 'default',
    approved: 'success',
    not_approved: 'warning',
    not_assessed: 'info',
    not_reviewed: 'info',
    true: 'success',
    false: 'warning'
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
      const [ov, formRes, respList] = await Promise.all([
        dashboardAPI.getFormOverview(formId),
        formAPI.getFormDetails(formId),
        formResponseAPI.getFormResponses(formId, systemId),
      ]);
      setDashboardData(ov.data);
      setFormName(formRes.data.name);
      setResponses(respList);
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
        approved: grp[0].approved,
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
    const progressMatch = 
      progressFilter === 'all' || 
      r.progress === progressFilter;

    // Approval filter
    const approvalMatch = 
      approvalFilter === 'all' || 
      (approvalFilter === 'not_assessed' && (!r.approved || r.approved === '')) ||
      (approvalFilter === 'approved' && r.approved === 'true') ||
      (approvalFilter === 'not_approved' && r.approved === 'false');
    return (
      dateInRange && progressMatch && approvalMatch && (
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
      width: 80,
      sortable: false,
      renderCell: (params) => (
        params.api.getSortedRowIds().indexOf(params.id) + 1
      ),
    },
    {
      field: 'visitorId',
      headerName: 'Visitor ID',
      width: 140,
      renderCell: (params) => <span>{params.value}</span>,
    },
    ...(activeTab !== 2 ? [
      // {
      //   field: 'groupId',
      //   headerName: 'Group ID',
      //   width: 140,
      // },
      {
        field: 'count',
        headerName: 'Visitors',
        width: 90,
        sortable: false,
        renderCell: params => params.row.isGroup ? params.value : '1',
      }
    ] : []),
    {
      field: 'updatedAt',
      headerName: 'Last Modified At',
      width: 180,
      renderCell: (params) => (
        <span>
          {
            params.value
              ? new Date(params.value).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
              : ''
          }
        </span>
      ),
    },
    // {
    //   field: 'createdAt',
    //   headerName: 'Created At',
    //   width: 180,
    //   renderCell: (params) => (
    //     <span>
    //       {
    //         params.value
    //           ? new Date(params.value).toLocaleString('en-US', {
    //               year: 'numeric',
    //               month: '2-digit',
    //               day: '2-digit',
    //               hour: '2-digit',
    //               minute: '2-digit',
    //               hour12: false,
    //             })
    //           : ''
    //       }
    //     </span>
    //   ),
    // },
    {
      field: 'submittedAt',
      headerName: 'Last Submitted At',
      width: 200,
      renderCell: (params) => (
        <span>
          {
            params.value
              ? new Date(params.value).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
              : 'N/A'
          }
        </span>
      ),
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 120,
      sortable: false,
      renderCell: params => (
        <Chip
          label={
            params.value === 'not_started'
              ? 'In Progress'
              : (params.value || '')
                  .replace('_', ' ')
                  .replace(/\b\w/g, c => c.toUpperCase())
          }
          color={statusColors[params.value] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'approval',
      headerName: 'Approval',
      width: 130,
      sortable: false,
      renderCell: params => {
        const val = params.row.approved;
        // console.log('VAL',val);
        const label =
          val === 'true'
            ? 'Approved'
            : val === 'false'
            ? 'Rejected'
            : 'Not Reviewed';
        return (
          <Chip
            label={label}
            color={statusColors[val] || 'default'}
            size="small"
          />
        );

        // if (params.row.isGroup) {
        //   const { notAssessed, approved, notApproved } = params.row.counts;
        //   return (
        //     <>
        //       <Chip label={`${notAssessed} Not Reviewed`} color={statusColors.not_assessed} size="small" sx={{ mr: .5 }}/>
        //       <Chip label={`${approved} Approved`}      color={statusColors.true}         size="small" sx={{ mr: .5 }}/>
        //       <Chip label={`${notApproved} Not Approved`} color={statusColors.false}        size="small"/>
        //     </>
        //   );
        // } else {
        //   let label = 'Not Reviewed';
        //   if (params.row.approved === 'true')  label = 'Approved';
        //   if (params.row.approved === 'false') label = 'Not Approved';
        //   return (
        //     <Chip label={label} color={statusColors[params.row.approved] || 'default'} size="small"/>
        //   );
        // }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 230,
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
              var url = `/systems/${systemId}/form/${formId}/response/${params.row.id}`
              if (params.row.isGroup) {
                url = `/systems/${systemId}/form/${formId}/group/${params.row.id}`
              }
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
    const url = `/systems/${systemId}/form/${formId}/response/${respId}`;
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

  const handleExport = () => {
    // 1. Grab the current filtered rows from your DataGrid
    let exportRows = [...rows];

    // 2. Apply the same sorting you have in the grid
    if (sortModel.length) {
      const { field, sort } = sortModel[0];
      exportRows.sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        if (aVal < bVal) return sort === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 3. Map to a flat array of plain objects
    const dataToExport = exportRows.map((r, idx) => ({
      'S.No'               : idx + 1,
      'Visitor ID'         : r.visitorId,
      'Group ID'           : r.isGroup ? r.id : '',
      'Visitors'           : r.count || 1,
      'Last Modified At'   : r.updatedAt
                              ? new Date(r.updatedAt).toLocaleString('en-US', {
                                  year:   'numeric',
                                  month:  '2-digit',
                                  day:    '2-digit',
                                  hour:   '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })
                              : '',
      'Last Submitted At'  : r.submittedAt
                              ? new Date(r.submittedAt).toLocaleString('en-US', {
                                  year:   'numeric',
                                  month:  '2-digit',
                                  day:    '2-digit',
                                  hour:   '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })
                              : 'N/A',
      'Progress'           : (r.progress || 'not_started')
                              .replace('_', ' ')
                              .replace(/\b\w/g, c => c.toUpperCase()),
      'Approval'           : r.approved === 'true'
                              ? 'Approved'
                              : r.approved === 'false'
                                ? 'Not Approved'
                                : 'Not Reviewed',
    }));

    // 4. Build worksheet & workbook
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');

    // 5. Trigger download
    const filename = `${formName.replace(/\s+/g,'_') || 'Form'}_Responses.xlsx`;
    XLSX.writeFile(wb, filename);
  };


  if (loading) return <Loading />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div style={{ paddingTop: 20 }}>
      <BackButton label="Home" />

      <Box textAlign="center" mb={2}>
        {/* <Typography variant="h4">{formName}</Typography> */}
        <Typography variant="h4"> Visit Requests </Typography>
        {/* <Typography variant="h4">{userRole} – Dashboard</Typography> */}
        {/* <Typography variant="body2">
          System: <strong>{systemName}</strong>
        </Typography> */}
      </Box>
      {/* <Box textAlign="center" mb={3}>
        {mappedRole === USER_ROLES.APP_USER && <EmbassyUserStepper currentStageIndex={0} submissionStatus="" approvalStatus="" />}
        {mappedRole === USER_ROLES.SUPERVISOR && <ApproverStepper currentStageIndex={0} approvalStatus="" />}
      </Box> */}

        <Box display="flex" justifyContent="center" mb={2} gap={2}>
          {mappedRole === USER_ROLES.APP_USER && (
          <Button variant="contained"  color="success"  onClick={handleNew}>
            <i className="fa-solid fa-circle-plus me-2"></i>
            New Visit Request
          </Button>)}
          {formId == 9 && mappedRole === USER_ROLES.APP_USER && (
            <ExcelImportButton
              formId={formId}
              systemId={systemId}
              onImportComplete={fetchData}
            />
          )}
          <Button
            variant="contained"
            color="secondary"
              sx={{ bgcolor: 'goldenrod' }}
            onClick={handleExport}
          >
            <i className="fas fa-upload me-2"></i>
            Export Search Results
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() =>
              navigate(`/systems/${systemId}/forms/${formId}/response-status`)
            }
          >
            <RuleIcon className='me-2'/>
            Manage Bulk Requests
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              navigate(`/multipdf-search/systems/${systemId}/forms/${formId}`)
            }
            sx={{ display: mappedRole === USER_ROLES.SUPERVISOR ? 'block' : 'none'}}
          >
            <SearchIcon className='me-2'/>
            Search in Attachments
          </Button> 
        </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }} mb={3}>
        {/* <Tabs value={activeTab} onChange={handleTabChange} centered> */}
          
          {/* <Button
            variant="contained"
            onClick={() =>
              navigate(`/multipdf-search/systems/${systemId}/forms/${formId}`)
            }
            sx={{ position: 'absolute', left: 20, top: '47%', transform: 'translateY(-47%)', display: mappedRole === USER_ROLES.SUPERVISOR ? 'block' : 'none'}}
          >
            <SearchIcon className='me-2'/>
            Search in Attachments
          </Button> 
          <Tab label="Show All" />
          <Tab label="Single Responses" />
          <Tab label="Group Responses" />
          <Button
            variant="contained"
            onClick={() =>
              navigate(`/systems/${systemId}/forms/${formId}/response-status`)
            }
            sx={{ position: 'absolute', right: 20, top: '47%', transform: 'translateY(-47%)' }}
          >
            <RuleIcon className='me-2'/>
            Manage Bulk Requests
          </Button> */}
        {/* </Tabs> */}
      </Box>
      {/* { mappedRole ==  USER_ROLES.SUPERVISOR &&
      <Box px={2} mb={2} ml={2} display="flex" gap={2}>
        To view unprocessed requests please select Progress as Submitted and Approval as Not Reviewed
      </Box>} */}
      <Box px={2} mb={1} ml={2} display="flex" gap={2} sx={{fontSize: '18px', fontWeight: 'bolder'}}>
        Search Visit Requests:
      </Box>
      {/* Search */}
      <Box px={2} mb={2} ml={2} display="flex" gap={2}>
        { mappedRole ==  USER_ROLES.SUPERVISOR &&
        <Button
          size="medium"
          variant="outlined"
          onClick={() => {
            setSearchTerm('');
            setProgressFilter('submitted');
            setApprovalFilter('not_assessed');
            setDateRange({ from: null, to: null });
          }}          
          sx={{
            height: 40,
            whiteSpace: 'nowrap',
            textTransform: 'none',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
          >Show Unprocessed Requests
        </Button>}
        <TextField
          sx={{width:"17%", backgroundColor: 'white'}} 
          size="small"
          // fullWidth
          placeholder="Search by Visitor ID"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {/* <TextField
            size="small"
            placeholder="Search by Visitor ID"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            sx={{ width: 250 }}  // Reduced width
          /> */}
        <FormControl size="small" sx={{ minWidth: 140, backgroundColor: 'white' }}>
          <InputLabel id="response-type-label">Request Type</InputLabel>
          <Select
            labelId="response-type-label"
            value={activeTab}
            label="Response Type"
            onChange={e => setActiveTab(e.target.value)}
          >
            <MenuItem value={1}>All</MenuItem>
            <MenuItem value={2}>Single Requests</MenuItem>
            <MenuItem value={3}>Group Requests</MenuItem>
          </Select>
        </FormControl>
        {/* Progress Filter */}
        <FormControl size="small" sx={{ minWidth: 130, backgroundColor: 'white' }}>
          <InputLabel>Progress</InputLabel>
          <Select
            value={progressFilter}
            onChange={(e) => setProgressFilter(e.target.value)}
            label="Progress"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="not_started">Not Started</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
          </Select>
        </FormControl>

        {/* Approval Filter */}
        <FormControl size="small" sx={{ minWidth: 130, backgroundColor: 'white' }}>
          <InputLabel>Approval</InputLabel>
          <Select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            label="Approval"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="not_assessed">Not Reviewed</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="not_approved">Not Approved</MenuItem>
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
            sx={{ width: 170, backgroundColor: 'white' }}
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
            sx={{ width: 140, backgroundColor: 'white' }}
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
            setProgressFilter('all');
            setApprovalFilter('all');
            setActiveTab(1);
            setDateRange({ from: null, to: null });
          }}
          sx={{
            height: 40,
            whiteSpace: 'nowrap'
          }}
          disabled={
            !searchTerm && 
            activeTab === 1 &&
            progressFilter === 'all' && 
            approvalFilter === 'all' && 
            !dateRange.from && 
            !dateRange.to
          }
        >
          Clear
        </Button>
      </Box>

      {/* DataGrid */}
      <Paper elevation={1} sx={{ width: '95%', margin: '0 auto', border: '1px black solid' }} ref={printRef}>
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
      {/* <Box display="flex" justifyContent="flex-end" mr={2}>
        <Tooltip title="Print Overview">
          <IconButton onClick={handlePrint} size="small">
            <PrintIcon />
          </IconButton>
        </Tooltip>
      </Box> */}

      {/* Dashboard Cards & Charts */}
      <Grid container spacing={3} display="flex" justifyContent="space-evenly" marginTop="2%" marginBottom="2%" marginLeft="1%">
        {/* Submission Progress */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Submission Progress
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <DashboardCard
                title="Not Started"
                value={dashboardData.formStatus.not_started || 0}
                color='warning'
                status="not_started"    
                formId={formId}   
                systemId={systemId}      
              />
            </Grid>
            <Grid item xs={4}>
              <DashboardCard
                title="In Progress"
                value={dashboardData.formStatus.in_progress || 0}
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
                color="success"
                status="submitted"    
                formId={formId}   
                systemId={systemId}   
              />
            </Grid>
          </Grid>
          {/* <Box mt={2}>
            <AnalyticsChart
              title="Progress Chart"
              height={300}
              data={[
                { name: 'Not Started', value: dashboardData.formStatus.not_started || 0 },
                { name: 'In Progress', value: dashboardData.formStatus.in_progress || 0 },
                { name: 'Submitted', value: dashboardData.formStatus.submitted || 0 },
              ]}
            />
          </Box> */}
        </Grid>

        {/* Approval Status */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Approval Status
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <DashboardCard
                title="Not Reviewed"
                value={dashboardData.approvalStatus.not_assessed || 0}
                color="info"
                approved="not_assessed"    
                formId={formId}   
                systemId={systemId}      
              />
            </Grid>
            <Grid item xs={4}>
              <DashboardCard
                title="Rejected"
                value={dashboardData.approvalStatus.not_approved || 0}
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
                color="success"
                approved="approved"    
                formId={formId}   
                systemId={systemId}   
              />
            </Grid>
          </Grid>
          {/* <Box mt={2}>
            <AnalyticsChart
              title="Approval Chart"
              height={300}
              data={[
                { name: 'Approved', value: dashboardData.approvalStatus.approved || 0 },
                { name: 'Not Approved', value: dashboardData.approvalStatus.not_approved || 0 },
                { name: 'Not Reviewed', value: dashboardData.approvalStatus.not_assessed || 0 },
              ]}
            />
          </Box> */}
        </Grid>

        {/* Recent Activity */}
        {/* <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <RecentActivityList activities={dashboardData.recentActivity} />
        </Grid> */}
      </Grid>
    </div>
  );
};

export default FormDashboard;

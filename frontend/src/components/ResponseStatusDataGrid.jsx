import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, CircularProgress, Button, MenuItem, 
  FormControl, InputLabel, Select, Stack, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ClearIcon from '@mui/icons-material/Clear';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formResponseAPI } from '../api/api';
import { formatDistanceToNow, isWithinInterval, parseISO } from 'date-fns';
import { SystemLayout } from './SystemLayout';
import { TRIMMED_ID, FVS_FIELD_MAPPING } from '../constants/constants';

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

const progressOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' }
];

const approvalOptions = [
  { value: 'not_assessed', label: 'Not Reviewed' },
  { value: 'not_approved', label: 'Not Approved' },
  { value: 'approved', label: 'Approved' }
];

export const ResponseStatus = () => {
  const { systemId, formId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get filter values from URL
  const status = searchParams.get('status') || '';
  const approved = searchParams.get('approved') || '';

  // Local state for date filtering
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [allResponses, setAllResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add this to your API response handling
useEffect(() => {
  const fetchResponses = async () => {
    try {
      setLoading(true);
      const res = await formResponseAPI.getResponseStatus(formId, systemId, status, approved);
      console.log(res);
      // Validate response structure
      const validatedResponses = res.map(item => ({
        _id: item._id || '',
        display_id: item.display_id || '',
        progress: item.progress || 'not_started',
        approved: item.approved || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        submittedAt: item.submittedAt || null,
        fields: item.fields || {},
        group_id: item.group_id || null
      }));
      setAllResponses(validatedResponses);
    } catch (err) {
      console.error('Failed to fetch responses:', err);
    } finally {
      setLoading(false);
    }
  };
  fetchResponses();
}, [formId, systemId, status, approved]);

  // Apply date filtering locally
  const filteredResponses = useMemo(() => {
    if (!fromDate && !toDate) return allResponses;
    
    return allResponses.filter(response => {
      const dateRange = {
        start: fromDate || new Date(0),
        end: toDate || new Date()
      };

      return (
        isWithinInterval(parseISO(response.createdAt), dateRange) ||
        isWithinInterval(parseISO(response.updatedAt), dateRange) ||
        (response.submittedAt && isWithinInterval(parseISO(response.submittedAt), dateRange))
      );
    });
  }, [allResponses, fromDate, toDate]);

  // DataGrid columns configuration
// Updated columns configuration with complete error handling
const columns = [
  { 
    field: 'display_id', 
    headerName: 'Request ID', 
    width: 120,
    valueGetter: (params) => {
      if (!params?.row?.display_id) return 'N/A';
      const trimLength = TRIMMED_ID || 6; // Default to 6 if TRIMMED_ID missing
      return params.row.display_id.slice(-trimLength);
    }
  },
  {
    field: 'name',
    headerName: 'Name',
    width: 200,
    valueGetter: (params) => {
      if (!params?.row?.fields) return 'N/A';
      const firstName = params.row.fields[FVS_FIELD_MAPPING?.fname] || '';
      const lastName = params.row.fields[FVS_FIELD_MAPPING?.lname] || '';
      return `${firstName} ${lastName}`.trim() || 'N/A';
    }
  },
  {
    field: 'dates',
    headerName: 'Dates',
    width: 200,
    valueGetter: (params) => {
      if (!params?.row?.fields) return 'Start: N/A\nEnd: N/A';
      const startDate = params.row.fields[FVS_FIELD_MAPPING?.sdate] || 'N/A';
      const endDate = params.row.fields[FVS_FIELD_MAPPING?.edate] || 'N/A';
      return `Start: ${startDate}\nEnd: ${endDate}`;
    }
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 180,
    renderCell: (params) => {
      const progress = params?.row?.progress || 'not_started';
      const approved = params?.row?.approved || '';
      
      return (
        <Box display="flex" gap={1}>
          <Chip
            label={progress.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            size="small"
            color={statusColors[progress] || 'default'}
          />
          <Chip
            label={
              approved === 'true'
                ? 'Approved'
                : approved === 'false'
                ? 'Not Approved'
                : 'Not Reviewed'
            }
            color={statusColors[approved] || 'info'}
            size="small"
          />
        </Box>
      );
    }
  },
  {
    field: 'timestamps',
    headerName: 'Timestamps',
    width: 250,
    valueGetter: (params) => {
      if (!params?.row) return 'N/A';
      
      const createdAt = params.row.createdAt 
        ? formatDistanceToNow(parseISO(params.row.createdAt), { addSuffix: true })
        : 'N/A';
      
      const submittedAt = params.row.submittedAt 
        ? formatDistanceToNow(parseISO(params.row.submittedAt), { addSuffix: true })
        : null;
      
      const updatedAt = params.row.updatedAt 
        ? formatDistanceToNow(parseISO(params.row.updatedAt), { addSuffix: true })
        : 'N/A';
      
      return `Created: ${createdAt}\n` +
             (submittedAt ? `Submitted: ${submittedAt}\n` : '') +
             `Updated: ${updatedAt}`;
    }
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      if (!params?.row?._id) return null;
      
      const url = params.row.group_id 
        ? `/systems/${systemId}/form/${formId}/group/${params.row.group_id}`
        : `/systems/${systemId}/form/${formId}/response/${params.row._id}`;
      
      return (
        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate(url)}
        >
          View/Edit
        </Button>
      );
    }
  }
];

  const handleStatusChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) newParams.set('status', e.target.value);
    else newParams.delete('status');
    setSearchParams(newParams);
  };

  const handleApprovalChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) newParams.set('approved', e.target.value);
    else newParams.delete('approved');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setFromDate(null);
    setToDate(null);
  };

  return (
    <SystemLayout systemId={systemId} formId={formId}>
      <Box p={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Visitor Requests</Typography>
          <Button
            startIcon={<ClearIcon />}
            onClick={clearAllFilters}
            disabled={!status && !approved && !fromDate && !toDate}
          >
            Clear All
          </Button>
        </Stack>

        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Submission Progress</InputLabel>
            <Select
              value={status}
              onChange={handleStatusChange}
              label="Submission Progress"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {progressOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Approval Status</InputLabel>
            <Select
              value={approved}
              onChange={handleApprovalChange}
              label="Approval Status"
            >
              <MenuItem value="">All Approvals</MenuItem>
              {approvalOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              slotProps={{ textField: { sx: { width: 200 } }}}
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={setToDate}
              slotProps={{ textField: { sx: { width: 200 } }}}
            />
          </LocalizationProvider>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredResponses}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              getRowId={(row) => row._id}
              sx={{
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  alignItems: 'center'
                }
              }}
            />
          </Box>
        )}
      </Box>
    </SystemLayout>
  );
};
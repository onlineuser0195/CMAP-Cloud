import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, List, ListItem, ListItemText,
  CircularProgress, Button, MenuItem, FormControl, InputLabel,
  Select, Stack, Pagination, TableSortLabel, TextField
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formResponseAPI } from '../api/api';
import { formatDistanceToNow, isWithinInterval, parseISO } from 'date-fns';
import { SystemLayout } from './SystemLayout';
import { TRIMMED_ID } from '../constants/constants';
import { FVS_FIELD_MAPPING } from '../constants/constants';
import useAuth from '../hooks/AuthContext';

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

const SORT_OPTIONS = {
  updatedAt: 'Last Updated',
  createdAt: 'Created Date',
  submittedAt: 'Submitted Date',
  display_id: 'Request ID'
};

const ITEMS_PER_PAGE = 10;

const REQUIRED_FIELDS = [
  FVS_FIELD_MAPPING.fname,
  FVS_FIELD_MAPPING.lname,
  FVS_FIELD_MAPPING.sdate,
  FVS_FIELD_MAPPING.edate,
  FVS_FIELD_MAPPING.site,
  FVS_FIELD_MAPPING.purpose,
  FVS_FIELD_MAPPING.passport
];

export const ResponseStatus = () => {
  const { systemId, formId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userRole, mappedRole, userId } = useAuth();   

  // Get filter, sort, and search values from URL
  const status = searchParams.get('status') || '';
  const approved = searchParams.get('approved') || '';
  const sortField = searchParams.get('sort') || 'updatedAt';
  const sortDirection = searchParams.get('dir') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('search') || '';

  // Local state for date filtering (not in URL)
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [allResponses, setAllResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data when URL params change
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        const res = await formResponseAPI.getResponseStatus(
          formId, 
          systemId,
          status || null, 
          approved || null
        );
        setAllResponses(res);
      } catch (err) {
        console.error('Failed to fetch responses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, [formId, systemId, status, approved]);

  // Check if all required fields are filled
  const allFieldsFilled = (response) => {
    if (!response.fields) return false;
    return REQUIRED_FIELDS.every(field => response.fields[field]);
  };

  // Handle submit action
  const handleSubmit = async (respId) => {
    try {
      await formResponseAPI.updateFormProgress(
        respId,
        formId,
        systemId,
        'submitted',
        userId
      );
      // Refresh the list after submission
      const res = await formResponseAPI.getResponseStatus(
        formId, 
        systemId, 
        status || null, 
        approved || null
      );
      setAllResponses(res);
    } catch (err) {
      console.error('Failed to submit response:', err);
    }
  };

  // Handle approve/reject action
  const handleApproval = async (respId, decision) => {
    try {
      await formResponseAPI.updateFormApproval(
        respId,
        formId,
        systemId,
        decision,
        '', // Empty comment as per requirements
        userId
      );
      // Refresh the list after approval/rejection
      const res = await formResponseAPI.getResponseStatus(
        formId, 
        systemId, 
        status || null, 
        approved || null
      );
      setAllResponses(res);
    } catch (err) {
      console.error('Failed to update approval status:', err);
    }
  };

  // Apply sorting, date filtering, and search
  const filteredResponses = useMemo(() => {
    let results = [...allResponses];
    
    // Apply date filtering
    if (fromDate || toDate) {
      const dateRange = {
        start: fromDate || new Date(0),
        end: toDate || new Date()
      };

      results = results.filter(response => (
        isWithinInterval(parseISO(response.createdAt), dateRange) ||
        isWithinInterval(parseISO(response.updatedAt), dateRange) ||
        (response.submittedAt && isWithinInterval(parseISO(response.submittedAt), dateRange))
      ));
    }

    // Apply search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(response => {
        // Search in display_id
        if (response.display_id.toLowerCase().includes(query)) {
          return true;
        }

        // Search in fields if they exist
        if (response.fields) {
          const name = `${response.fields[FVS_FIELD_MAPPING.fname] || ''} ${response.fields[FVS_FIELD_MAPPING.mi] || ''} ${response.fields[FVS_FIELD_MAPPING.lname] || ''}`.toLowerCase();
          const startDate = response.fields[FVS_FIELD_MAPPING.sdate] || '';
          const endDate = response.fields[FVS_FIELD_MAPPING.edate] || '';
          const site = response.fields[FVS_FIELD_MAPPING.site] || '';
          const purpose = response.fields[FVS_FIELD_MAPPING.purpose] || '';
          const passport = response.fields[FVS_FIELD_MAPPING.passport] || '';

          return (
            name.includes(query) ||
            startDate.toLowerCase().includes(query) ||
            endDate.toLowerCase().includes(query) ||
            site.toLowerCase().includes(query) ||
            purpose.toLowerCase().includes(query) ||
            passport.toLowerCase().includes(query)
          );
        }

        return false;
      });
    }

    // Apply sorting
    results.sort((a, b) => {
      let aValue, bValue;

      if (sortField === 'display_id') {
        // For display_id, we need to compare them as numbers
        aValue = parseInt(a.display_id.replace(/\D/g, ''));
        bValue = parseInt(b.display_id.replace(/\D/g, ''));
      } else {
        // For date fields, compare as dates
        aValue = a[sortField] ? new Date(a[sortField]).getTime() : 0;
        bValue = b[sortField] ? new Date(b[sortField]).getTime() : 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return results;
  }, [allResponses, fromDate, toDate, searchQuery, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredResponses.length / ITEMS_PER_PAGE);
  const paginatedResponses = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredResponses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredResponses, page]);

  const handleStatusChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) newParams.set('status', e.target.value);
    else newParams.delete('status');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleApprovalChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) newParams.set('approved', e.target.value);
    else newParams.delete('approved');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set('search', e.target.value);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSort = (field) => {
    const newParams = new URLSearchParams(searchParams);
    if (sortField === field) {
      newParams.set('dir', sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      newParams.set('sort', field);
      newParams.set('dir', 'desc');
    }
    setSearchParams(newParams);
  };

  const handlePageChange = (event, newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams({ page: '1' }));
    setFromDate(null);
    setToDate(null);
  };

  const getSortDirection = (field) => {
    if (sortField === field) {
      return sortDirection;
    }
    return undefined;
  };

  // Helper function to render field value or "Missing" chip
  const renderField = (value) => {
    return value ? (
      <span>{value}</span>
    ) : (
      <Chip label="Missing" size="small" color="error" sx={{ }} />
    );
  };

  return (
    <SystemLayout systemId={systemId} formId={formId}>
      <Box p={3}>
        {/* Search Box */}
        <Box mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by Request ID, Name, Dates, Site, or Purpose..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Box>

        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Filter Responses</Typography>
          <Button
            startIcon={<ClearIcon />}
            onClick={clearAllFilters}
            disabled={!status && !approved && !fromDate && !toDate && !searchQuery}
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

        {/* Sorting controls */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          {Object.entries(SORT_OPTIONS).map(([field, label]) => (
            <Button
              key={field}
              onClick={() => handleSort(field)}
              endIcon={
                <TableSortLabel
                  active={sortField === field}
                  direction={getSortDirection(field)}
                  hideSortIcon
                />
              }
              sx={{ textTransform: 'none' }}
            >
              {label} {sortField === field && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
          ))}
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <List>
              {paginatedResponses.map((resp) => (
                <ListItem key={resp._id} divider>
                  <ListItemText
                    primary={
                      <>
                        <Typography variant="subtitle1">
                          Visitor Request ID: {resp.display_id.slice(-TRIMMED_ID)}
                        </Typography>
                        <Box display="flex" gap={1} mt={1}>
                          <Chip
                            label={resp.progress.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not Started'}
                            size="small"
                            color={statusColors[resp.progress] || 'default'}
                          />
                          <Chip
                            label={
                              resp.approved === 'true'
                                ? 'Approved'
                                : resp.approved === 'false'
                                ? 'Not Approved'
                                : resp.approved?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not Reviewed'
                            }
                            color={statusColors[resp.approved] || 'info'}
                            size="small"
                          />
                        </Box>
                      </>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Created: {formatDistanceToNow(parseISO(resp.createdAt), { addSuffix: true })}
                          {resp.submittedAt && ` • Submitted: ${formatDistanceToNow(parseISO(resp.submittedAt), { addSuffix: true })}`}
                          {` • Updated: ${formatDistanceToNow(parseISO(resp.updatedAt), { addSuffix: true })}`}
                        </Typography>
                        {resp.fields && (
                          <Typography variant="caption" color="text.secondary">
                            <b>Name:</b> {renderField(`${resp.fields[FVS_FIELD_MAPPING.fname] || ''} ${resp.fields[FVS_FIELD_MAPPING.mi] || ''} ${resp.fields[FVS_FIELD_MAPPING.lname] || ''}`.trim())} |
                            <b> Start Date:</b> {renderField(resp.fields[FVS_FIELD_MAPPING.sdate])} | <b>End Date:</b> {renderField(resp.fields[FVS_FIELD_MAPPING.edate])} | 
                            <b> Site:</b> {renderField(resp.fields[FVS_FIELD_MAPPING.site])} | <b>Passport No.:</b> {renderField(resp.fields[FVS_FIELD_MAPPING.passport])} | 
                            <b> Purpose:</b> {renderField(resp.fields[FVS_FIELD_MAPPING.purpose])}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        var url = `/systems/${systemId}/form/${formId}/response/${resp._id}`
                        if (resp.group_id) {
                          url = `/systems/${systemId}/form/${formId}/group/${resp.group_id}`
                        }
                        navigate(url);
                      }}
                    >
                      View/Edit
                    </Button>
                    {resp.progress !== 'submitted' && allFieldsFilled(resp) && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleSubmit(resp._id)}
                      >
                        Submit
                      </Button>
                    )}
                    {resp.progress === 'submitted' && resp.approved === '' && (
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleApproval(resp._id, 'true')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleApproval(resp._id, 'false')}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </SystemLayout>
  );
};
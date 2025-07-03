import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, List, ListItem, ListItemText,
  CircularProgress, Button, MenuItem, FormControl, InputLabel,
  Select, TextField, Stack
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formResponseAPI } from '../api/api';
import { formatDistanceToNow, isWithinInterval, parseISO } from 'date-fns';
import { SystemLayout } from './SystemLayout';

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
  const navigate = useNavigate();

  // State for all responses and filters
  const [allResponses, setAllResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [approved, setApproved] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // Fetch all responses on mount
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        const res = await formResponseAPI.getResponseStatus(formId, systemId);
        setAllResponses(res);
      } catch (err) {
        console.error('Failed to fetch responses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, [formId, systemId]);

  // Filter responses based on current filters
  const filteredResponses = useMemo(() => {
    return allResponses.filter(response => {
      // Status filter
      if (status && response.progress !== status) return false;
      
      // Approval filter (unchanged from original working version)
      if (approved) {
        if (approved === 'approved' && response.approved !== 'true') return false;
        if (approved === 'not_approved' && response.approved !== 'false') return false;
        if (approved === 'not_assessed' && response.approved) return false;
      }
      
      // Date range filter (only if dates are selected)
      if (fromDate || toDate) {
        const dateRange = {
          start: fromDate || new Date(0),
          end: toDate || new Date()
        };

        const hasDateInRange = 
          isWithinInterval(parseISO(response.createdAt), dateRange) ||
          isWithinInterval(parseISO(response.updatedAt), dateRange) ||
          (response.submittedAt && isWithinInterval(parseISO(response.submittedAt), dateRange));

        if (!hasDateInRange) return false;
      }

      return true;
    });
  }, [allResponses, status, approved, fromDate, toDate]);

  const clearAllFilters = () => {
    setStatus('');
    setApproved('');
    setFromDate(null);
    setToDate(null);
  };

  return (
    <SystemLayout systemId={systemId} formId={formId}>
      <Box p={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Filter Responses</Typography>
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
              onChange={(e) => setStatus(e.target.value)}
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
              onChange={(e) => setApproved(e.target.value)}
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
              renderInput={(params) => <TextField {...params} sx={{ width: 200 }} />}
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={setToDate}
              renderInput={(params) => <TextField {...params} sx={{ width: 200 }} />}
            />
          </LocalizationProvider>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <List>
            {filteredResponses.map((resp, index) => (
              <ListItem key={resp._id} divider>
                <ListItemText
                  primary={
                    <>
                      <Typography variant="subtitle1">
                        Response ID: {resp._id}
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
                              : 'Not Reviewed'
                          }
                          color={
                            resp.approved === 'true'
                              ? 'success'
                              : resp.approved === 'false'
                              ? 'warning'
                              : 'info'
                          }
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
                          Name: {resp.fields[1] || 'N/A'}, Date: {resp.fields[121215] || 'N/A'}
                        </Typography>
                      )}
                    </>
                  }
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    navigate(`/form-details/${formId}`, {
                      state: { systemId: Number(systemId), respId: resp._id }
                    })
                  }
                >
                  View/Edit
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </SystemLayout>
  );
};
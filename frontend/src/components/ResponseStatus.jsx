import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, List, ListItem, ListItemText,
  CircularProgress, Button, MenuItem, FormControl, InputLabel,
  Select, Stack, Pagination, TableSortLabel, TextField, Collapse, Avatar, IconButton
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PrintIcon from '@mui/icons-material/Print';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formResponseAPI, adminAPI } from '../api/api';
import { formatDistanceToNow, isWithinInterval, parseISO, format } from 'date-fns';
import { SystemLayout } from './SystemLayout';
import { TRIMMED_ID } from '../constants/constants';
import { FVS_FIELD_MAPPING, USER_ROLES} from '../constants/constants';
import useAuth from '../hooks/AuthContext';

const statusColors = {
  submitted: 'success',
  in_progress: 'warning',
  not_started: 'default',
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
  { value: 'not_approved', label: 'Rejected' },
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

const VIEW_TYPES = {
  ALL: 'all',
  GROUPS: 'groups',
  SINGLES: 'singles'
};

export const ResponseStatus = () => {
  const { systemId, formId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userRole, mappedRole, userId } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState({});
  const [viewType, setViewType] = useState(VIEW_TYPES.ALL);

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
        
        // Expand all groups by default
        const groups = res.filter(r => r.group_id);
        const groupIds = [...new Set(groups.map(g => g.group_id))];
        const expanded = {};
        groupIds.forEach(id => expanded[id] = true);
        setExpandedGroups(expanded);
      } catch (err) {
        console.error('Failed to fetch responses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, [formId, systemId, status, approved]);

  // Group responses by group_id and combine with standalone responses
  const combinedResponses = useMemo(() => {
    const groups = {};
    const standalone = [];
    
    allResponses.forEach(response => {
      if (response.group_id) {
        if (!groups[response.group_id]) {
          var updated_by = null;
          groups[response.group_id] = {
            group_id: response.group_id,
            responses: [],
            display_id: response.display_id,
            progress: response.progress,
            approved: response.approved,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
          // Only include if present in response
          ...(response.created_by && { created_by: response.created_by }),
          ...(response.updated_by && { updated_by: updated_by }), //fix response.updated_by even though it is present in all collection documents
          ...(response.submitted_by && { submitted_by: response.submitted_by }),
            isGroup: true
          };
        }
        groups[response.group_id].responses.push(response);

        // Update these fields if a more recent response has them
        if (response.updatedAt > groups[response.group_id].updatedAt) {
          groups[response.group_id].updatedAt = response.updatedAt;
          if (response.updated_by) {
            groups[response.group_id].updated_by = response.updated_by;
          }        
        }
        if (response.submittedAt && (!groups[response.group_id].submittedAt || 
            new Date(response.submittedAt) > new Date(groups[response.group_id].submittedAt))) {
          groups[response.group_id].submittedAt = response.submittedAt;
          if (response.submitted_by) {
            groups[response.group_id].submitted_by = response.submitted_by;
          }        
        }
      } else {
        standalone.push({
          ...response,
          isGroup: false
        });
      }
    });

    // Combine all responses (groups and standalone) in a single array
    return [...Object.values(groups), ...standalone];
  }, [allResponses]);

  // Filter responses based on view type
  const filteredByViewType = useMemo(() => {
    switch(viewType) {
      case VIEW_TYPES.GROUPS:
        return combinedResponses.filter(r => r.isGroup);
      case VIEW_TYPES.SINGLES:
        return combinedResponses.filter(r => !r.isGroup);
      default:
        return combinedResponses;
    }
  }, [combinedResponses, viewType]);

  // Check if all required fields are filled for a response
  const allFieldsFilled = (response) => {
    if (!response.fields) return false;
    return REQUIRED_FIELDS.every(field => response.fields[field]);
  };

  // Check if all responses in a group have required fields filled
  const allGroupFieldsFilled = (group) => {
    return group.responses.every(response => allFieldsFilled(response));
  };

  // Handle submit action for single response or group
  const handleSubmit = async (id, isGroup = false) => {
    try {
      if (isGroup) {
        // Submit all responses in the group
        await Promise.all(
          allResponses
            .filter(resp => resp.group_id === id)
            .map(resp => formResponseAPI.updateFormProgress(
              resp._id,
              formId,
              systemId,
              'submitted',
              userId
            ))
        );
      } else {
        // Submit single response
        await formResponseAPI.updateFormProgress(
          id,
          formId,
          systemId,
          'submitted',
          userId
        );
      }
      
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

  // Handle approve/reject action for single response or group
  const handleApproval = async (id, decision, isGroup = false) => {
    try {
      if (isGroup) {
        // Approve/reject all responses in the group
        await Promise.all(
          allResponses
            .filter(resp => resp.group_id === id)
            .map(resp => formResponseAPI.updateFormApproval(
              resp._id,
              formId,
              systemId,
              decision,
              '', // Empty comment as per requirements
              userId
            ))
        );
      } else {
        // Approve/reject single response
        await formResponseAPI.updateFormApproval(
          id,
          formId,
          systemId,
          decision,
          '', // Empty comment as per requirements
          userId
        );
      }
      
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

  // Toggle group expansion
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Expand all groups
  const expandAllGroups = () => {
    const expanded = {};
    combinedResponses
      .filter(r => r.isGroup)
      .forEach(group => expanded[group.group_id] = true);
    setExpandedGroups(expanded);
  };

  // Collapse all groups
  const collapseAllGroups = () => {
    setExpandedGroups({});
  };

  // Apply sorting, date filtering, and search
  const filteredResponses = useMemo(() => {
    let results = [...filteredByViewType];
    
    // Apply date filtering
    if (fromDate || toDate) {
      const dateRange = {
        start: fromDate || new Date(0),
        end: toDate || new Date()
      };
      results = results.filter(item => {
        if (item.isGroup) {
          // For groups, check if any response in the group matches the date range
          return item.responses.some(response => (
            isWithinInterval(parseISO(response.createdAt), dateRange) ||
            isWithinInterval(parseISO(response.updatedAt), dateRange) ||
            (response.submittedAt && isWithinInterval(parseISO(response.submittedAt), dateRange))
          ));
        } else {
          // For standalone responses
          return (
            isWithinInterval(parseISO(item.createdAt), dateRange) ||
            isWithinInterval(parseISO(item.updatedAt), dateRange) ||
            (item.submittedAt && isWithinInterval(parseISO(item.submittedAt), dateRange))
          );
        }
      });
    }

    // Apply search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item => {
        if (item.isGroup) {
          // For groups, check if any response in the group matches the search
          return item.responses.some(response => {
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
        } else {
          // For standalone responses
          if (item.display_id.toLowerCase().includes(query)) {
            return true;
          }

          if (item.fields) {
            const name = `${item.fields[FVS_FIELD_MAPPING.fname] || ''} ${item.fields[FVS_FIELD_MAPPING.mi] || ''} ${item.fields[FVS_FIELD_MAPPING.lname] || ''}`.toLowerCase();
            const startDate = item.fields[FVS_FIELD_MAPPING.sdate] || '';
            const endDate = item.fields[FVS_FIELD_MAPPING.edate] || '';
            const site = item.fields[FVS_FIELD_MAPPING.site] || '';
            const purpose = item.fields[FVS_FIELD_MAPPING.purpose] || '';
            const passport = item.fields[FVS_FIELD_MAPPING.passport] || '';

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
        }
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
        const aDate = a.isGroup ? a[sortField] : a[sortField];
        const bDate = b.isGroup ? b[sortField] : b[sortField];
        aValue = aDate ? new Date(aDate).getTime() : 0;
        bValue = bDate ? new Date(bDate).getTime() : 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
    // Don't show Not started ones
    // results = results.filter(item => item.progress !== 'not_started');

    return results;
  }, [filteredByViewType, fromDate, toDate, searchQuery, sortField, sortDirection]);

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

  const UserDisplay = ({ userId }) => {
    const [name, setName] = useState('Loading...');
  
    useEffect(() => {
      adminAPI.getUser(userId)
        .then(res => setName(`${res.user.first_name} ${res.user.last_name}`))
        .catch(() => setName('Unknown User'));
    }, [userId]);
  
    return <>{name}</>;
  };

  // Helper function to render field value or "Missing" chip
  const renderField = (value) => {
    return value ? (
      <span>{value}</span>
    ) : (
        <span style={{color:'red'}}>Missing</span>
      // <Chip label="Missing" size="small" color="error" sx={{ }} />
    );
  };

  // Render a single response item
  const renderResponseItem = (response) => (
    <ListItem key={response._id} sx={{ pl: 3, ml: 2, borderLeft: '1px solid blue', backgroundColor: 'rgb(240, 240, 240)' }}>
      <ListItemText
        sx={{m:0}}
        // primary={
        //   <Typography variant="body2">
        //   </Typography>
        // }
        secondary={
          response.fields && (
            <Typography variant="caption" color="text.secondary">
              <b>Name: </b>
              {    response.fields ? (
                  response.fields[FVS_FIELD_MAPPING.fname] && response.fields[FVS_FIELD_MAPPING.lname] ? (
                    `${response.fields[FVS_FIELD_MAPPING.fname]} ${response.fields[FVS_FIELD_MAPPING.mi] || ''} ${response.fields[FVS_FIELD_MAPPING.lname]}`.trim()
                  ) : (
                    // <Chip label="Missing" size="small" color="error" sx={{ }} />
                    <span style={{color:'red'}}>Missing</span>
                  )
                ) : (
                  // <Chip label="Missing" size="small" color="error" sx={{ }} />
                  <span style={{color:'red'}}>Missing</span>
                )
              } | 
              <b> Start Date:</b> {renderField(response.fields[FVS_FIELD_MAPPING.sdate])} | <b>End Date:</b> {renderField(response.fields[FVS_FIELD_MAPPING.edate])} | 
              <b> Site:</b> {renderField(response.fields[FVS_FIELD_MAPPING.site])} | <b>Passport No.:</b> {renderField(response.fields[FVS_FIELD_MAPPING.passport])} | 
              <b> Purpose:</b> {renderField(response.fields[FVS_FIELD_MAPPING.purpose])}
            </Typography>
          )
        }
      />
    </ListItem>
  );

  // Render a group of responses
  const renderGroup = (group) => {
    const isExpanded = expandedGroups[group.group_id];
    const allFilled = allGroupFieldsFilled(group);
    const canSubmit = group.progress !== 'submitted' && allFilled && mappedRole === USER_ROLES.APP_USER;
    const canApproveReject = group.progress === 'submitted' && group.approved === '' && mappedRole === USER_ROLES.SUPERVISOR;;
    // console.log(group)
    return (
      <React.Fragment key={group.group_id}>
        <ListItem divider>
          <ListItemText
            primary={
              <>
                <Box display="flex" alignItems="center">
                  <Typography variant="subtitle1" sx={{mr:1}}>
                    Visitor(s) Request ID: {group.display_id.slice(-TRIMMED_ID)}
                  </Typography>
                  <Typography variant="body2" sx={{mr:1}} >
                    Number of Visitors:
                  </Typography>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 18, height: 18, mr: 1, fontSize:12 }}>
                    {group.responses.length}
                  </Avatar>
                  <IconButton size="small" onClick={() => toggleGroup(group.group_id)} sx={{ ml: 1 }}>
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Box display="flex" gap={1} mt={1}>
                  <Chip
                    label={
                      group.progress === 'not_started'
                        ? 'In Progress'
                        : group.progress.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
                    }
                    size="small"
                    color={statusColors[group.progress] || 'default'}
                  />
                  {group.progress === 'submitted' && (<Chip
                    label={
                      group.approved === 'true'
                        ? 'Approved'
                        : group.approved === 'false'
                        ? 'Rejected'
                        : group.approved?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not Reviewed'
                    }
                    color={statusColors[group.approved] || 'default'}
                    size="small"
                  />)}
                </Box>
              </>
            }
            secondary={
              <Typography variant="body2" color="text.secondary">
                Created: {formatDistanceToNow(parseISO(group.createdAt), { addSuffix: true })} {group.created_by && <> by <UserDisplay userId={group.created_by} /></>}
                {group.submittedAt && (
                  <>
                    {' • Submitted: '}
                    {formatDistanceToNow(parseISO(group.submittedAt), { addSuffix: true })} {group.submitted_by && <> by <UserDisplay userId={group.submitted_by} /></>}
                  </>
                )}
                {' • Updated: '}
                {formatDistanceToNow(parseISO(group.updatedAt), { addSuffix: true })} {group.updated_by && <> by <UserDisplay userId={group[0].updated_by} /></>}
              </Typography>

            }
          />
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              size="small"
              variant="outlined"
              sx={{ width: 190 }} 
              onClick={() => navigate(`/systems/${systemId}/form/${formId}/group/${group.group_id}`)}
            >
            <i className="fas fa-eye me-2"></i>View/Edit<i className="fas fa-pen m-2"></i>
            </Button>
            {canSubmit && (
              <Button
                size="small"
                variant="contained"
                sx={{ width: 190 }} 
                color="primary"
                onClick={() => handleSubmit(group.group_id, true)}
              >
                <i className="fa-solid fa-paper-plane me-2"></i>
                Submit
                {/* All */}
              </Button>
            )}
            {canApproveReject && (
              <Box display="flex" sx={{ width: 190 }} >
                <Button
                  sx={{mr:1}}
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => handleApproval(group.group_id, 'true', true)}
                >
                  <i className="fa-solid fa-check me-2"></i>
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => handleApproval(group.group_id, 'false', true)}
                >
                  <i className="fa-solid fa-xmark me-2"></i>
                  Reject
                </Button>
              </Box>
            )}
          </Box>
        </ListItem>
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {group.responses.map(renderResponseItem)}
          </List>
        </Collapse>
      </React.Fragment>
    );
  };

  // Render a standalone response
  const renderStandaloneResponse = (response) => {
    const allFilled = allFieldsFilled(response);
    const canSubmit = response.progress !== 'submitted' && allFilled  && mappedRole === USER_ROLES.APP_USER;
    const canApproveReject = response.progress === 'submitted' && response.approved === '' &&  mappedRole === USER_ROLES.SUPERVISOR;

    return (
      <ListItem key={response._id} divider>
        <ListItemText
          primary={
            <>
              <Typography variant="subtitle1">
                Visitor Request ID: {response.display_id.slice(-TRIMMED_ID)}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                  <Chip
                    label={
                      response.progress === 'not_started'
                        ? 'In Progress'
                        : response.progress.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
                    }
                    size="small"
                    color={statusColors[response.progress] || 'default'}
                  />
                {response.progress === 'submitted' && (<Chip
                  label={
                    response.approved === 'true'
                      ? 'Approved'
                      : response.approved === 'false'
                      ? 'Rejected'
                      : response.approved?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not Reviewed'
                  }
                  color={statusColors[response.approved] || 'default'}
                  size="small"
                />)}
              </Box>
            </>
          }
          secondary={
            <>
              <Typography variant="body2" color="text.secondary">
                Created: {formatDistanceToNow(parseISO(response.createdAt), { addSuffix: true })} {response.created_by &&  <>by  <UserDisplay userId={response.created_by}/> </>}
                {response.submittedAt && (
                  <>
                    {' • Submitted: '}
                    {formatDistanceToNow(parseISO(response.submittedAt), { addSuffix: true })} {response.submitted_by &&  <>by  <UserDisplay userId={response.submitted_by} /></>}
                  </>
                )}
                {' • Updated: '}
                {formatDistanceToNow(parseISO(response.updatedAt), { addSuffix: true })} {response.updated_by &&  <>by <UserDisplay userId={response.updated_by} /></>}
              </Typography>
              {response.fields && (
                <Typography variant="caption" color="text.secondary">
                  <b>Name:</b> {    response.fields ? (
                      response.fields[FVS_FIELD_MAPPING.fname] && response.fields[FVS_FIELD_MAPPING.lname] ? (
                        `${response.fields[FVS_FIELD_MAPPING.fname]} ${response.fields[FVS_FIELD_MAPPING.mi] || ''} ${response.fields[FVS_FIELD_MAPPING.lname]}`.trim()
                      ) : (
                        <span style={{color:'red'}}>Missing</span>
                        // <Chip label="Missing" size="small" color="error" sx={{ }} />
                      )
                    ) : (
                      <span style={{color:'red'}}>Missing</span>
                      // <Chip label="Missing" size="small" color="error" sx={{ }} />
                    )
                  } | 
                  <b> Start Date:</b> {renderField(response.fields[FVS_FIELD_MAPPING.sdate])} | <b>End Date:</b> {renderField(response.fields[FVS_FIELD_MAPPING.edate])} | 
                  <b> Site:</b> {renderField(response.fields[FVS_FIELD_MAPPING.site])} | <b>Passport No.:</b> {renderField(response.fields[FVS_FIELD_MAPPING.passport])} | 
                  <b> Purpose:</b> {renderField(response.fields[FVS_FIELD_MAPPING.purpose])}
                </Typography>
              )}
            </>
          }
        />
        <Box display="flex" flexDirection="column" gap={1}>
          <Button
            size="small"
            variant="outlined"
            sx={{ width: 190 }} 
            onClick={() => navigate(`/systems/${systemId}/form/${formId}/response/${response._id}`)}
          >
           <i className="fas fa-eye me-2"></i>View/Edit<i className="fas fa-pen m-2"></i>
          </Button>
          {canSubmit && (
            <Button
              size="small"
              variant="contained"
              sx={{ width: 190 }} 
              color="primary"
              onClick={() => handleSubmit(response._id)}
            >
              <i className="fa-solid fa-paper-plane me-2"></i>
              Submit
            </Button>
          )}
          {canApproveReject && (
            <Box display="flex" sx={{ width: 190 }} >
              <Button
                sx={{mr:1}}
                size="small"
                variant="contained"
                color="success"
                onClick={() => handleApproval(response._id, 'true')}
              >
                <i className="fa-solid fa-check me-2"></i>
                Approve
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={() => handleApproval(response._id, 'false')}
              >
                <i className="fa-solid fa-xmark me-2"></i>
                Reject
              </Button>
            </Box>
          )}
        </Box>
      </ListItem>
    );
  };


  // Print report function
  const handlePrintReport = async () => {
    try {
      // Get current date for the report header
      const reportDate = format(new Date(), 'MMMM dd, yyyy');
      
      // Prepare the print content
      let printContent = `
        <html>
          <head>
            <title>Visitor Requests Report - ${reportDate}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              .report-header { margin-bottom: 20px; }
              .report-footer { margin-top: 20px; font-size: 12px; color: #666; }
              .request-item { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
              .request-id { font-weight: bold; margin-bottom: 5px; }
              .request-status { display: flex; gap: 10px; margin-bottom: 5px; }
              .status-chip { 
                display: inline-block; 
                padding: 2px 8px; 
                border-radius: 12px; 
                font-size: 12px; 
                font-weight: bold;
              }
              .success { background-color: #4caf50; color: white; }
              .info { background-color: #2196f3; color: white; }
              .warning { background-color: #ff9800; color: white; }
              .error { background-color: #f44336; color: white; }
              .request-details { font-size: 14px; color: #555; margin-bottom: 5px; }
              .request-fields { font-size: 12px; color: #666; }
              .missing { color: red; }
              .group-header { background-color: #f5f5f5; padding: 10px; margin-bottom: 10px; }
              .visitor-count { 
                display: inline-block; 
                width: 18px; 
                height: 18px; 
                background-color: #1976d2; 
                color: white; 
                border-radius: 50%; 
                text-align: center; 
                line-height: 18px; 
                font-size: 12px; 
                margin-right: 5px;
              }
              .visitor-item { margin-left: 20px; padding-left: 10px; border-left: 2px solid #1976d2; margin-bottom: 10px; }
              .filter-info { margin-bottom: 20px; font-size: 14px; color: #555; }
              @media print {
                body { margin: 0; padding: 10px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <h1>Visitor Requests Report</h1>
              <div>Generated on: ${reportDate}</div>
      `;
  
      // Add filter information
      printContent += `<div class="filter-info"><strong>Filters Applied:</strong> `;
      const filters = [];
      if (status) filters.push(`Progress: ${progressOptions.find(o => o.value === status)?.label}`);
      if (approved) filters.push(`Approval: ${approvalOptions.find(o => o.value === approved)?.label}`);
      if (fromDate) filters.push(`From: ${format(fromDate, 'MM/dd/yyyy')}`);
      if (toDate) filters.push(`To: ${format(toDate, 'MM/dd/yyyy')}`);
      if (searchQuery) filters.push(`Search: "${searchQuery}"`);
      if (viewType !== VIEW_TYPES.ALL) filters.push(`View: ${viewType === VIEW_TYPES.GROUPS ? 'Groups Only' : 'Singles Only'}`);
      
      printContent += filters.length ? filters.join(', ') : 'None';
      printContent += `</div>`;
  
      // Add the data
      filteredResponses.forEach(item => {
        if (item.isGroup) {
          // Group item
          printContent += `
            <div class="group-header">
              <div class="request-id">Visitor(s) Request ID: ${item.display_id.slice(-TRIMMED_ID)}</div>
              <div class="request-status">
                <span class="status-chip ${statusColors[item.progress] || 'default'}">
                  ${item.progress.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'In Progress'}
                </span>
                <span class="status-chip ${statusColors[item.approved] || 'default'}">
                  ${item.approved === 'true' ? 'Approved' : 
                    item.approved === 'false' ? 'Rejected' : 
                    item.approved?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not Reviewed'}
                </span>
                <span class="visitor-count">${item.responses.length}</span>
              </div>
              <div class="request-details">
                Created: ${formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                ${item.submittedAt ? ` • Submitted: ${formatDistanceToNow(parseISO(item.submittedAt), { addSuffix: true })}` : ''}
                • Updated: ${formatDistanceToNow(parseISO(item.updatedAt), { addSuffix: true })}
              </div>
          `;
  
          // Add group responses
          item.responses.forEach(response => {
            printContent += `
              <div class="visitor-item">
                <div class="request-fields">
                  <strong>Name:</strong> ${response.fields ? 
                    (response.fields[FVS_FIELD_MAPPING.fname] && response.fields[FVS_FIELD_MAPPING.lname] ? 
                      `${response.fields[FVS_FIELD_MAPPING.fname]} ${response.fields[FVS_FIELD_MAPPING.mi] || ''} ${response.fields[FVS_FIELD_MAPPING.lname]}`.trim() : 
                      '<span class="missing">Missing</span>') : 
                    '<span class="missing">Missing</span>'} | 
                  <strong>Start Date:</strong> ${response.fields[FVS_FIELD_MAPPING.sdate] || '<span class="missing">Missing</span>'} | 
                  <strong>End Date:</strong> ${response.fields[FVS_FIELD_MAPPING.edate] || '<span class="missing">Missing</span>'} | 
                  <strong>Site:</strong> ${response.fields[FVS_FIELD_MAPPING.site] || '<span class="missing">Missing</span>'} | 
                  <strong>Passport No.:</strong> ${response.fields[FVS_FIELD_MAPPING.passport] || '<span class="missing">Missing</span>'} | 
                  <strong>Purpose:</strong> ${response.fields[FVS_FIELD_MAPPING.purpose] || '<span class="missing">Missing</span>'}
                </div>
              </div>
            `;
          });
  
          printContent += `</div>`;
        } else {
          // Standalone item
          printContent += `
            <div class="request-item">
              <div class="request-id">Visitor Request ID: ${item.display_id.slice(-TRIMMED_ID)}</div>
              <div class="request-status">
                <span class="status-chip ${statusColors[item.progress] || 'default'}">
                  ${item.progress.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'In Progress'}
                </span>
                <span class="status-chip ${statusColors[item.approved] || 'default'}">
                  ${item.approved === 'true' ? 'Approved' : 
                    item.approved === 'false' ? 'Rejected' : 
                    item.approved?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not Reviewed'}
                </span>
              </div>
              <div class="request-details">
                Created: ${formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                ${item.submittedAt ? ` • Submitted: ${formatDistanceToNow(parseISO(item.submittedAt), { addSuffix: true })}` : ''}
                • Updated: ${formatDistanceToNow(parseISO(item.updatedAt), { addSuffix: true })}
              </div>
              <div class="request-fields">
                <strong>Name:</strong> ${item.fields ? 
                  (item.fields[FVS_FIELD_MAPPING.fname] && item.fields[FVS_FIELD_MAPPING.lname] ? 
                    `${item.fields[FVS_FIELD_MAPPING.fname]} ${item.fields[FVS_FIELD_MAPPING.mi] || ''} ${item.fields[FVS_FIELD_MAPPING.lname]}`.trim() : 
                    '<span class="missing">Missing</span>') : 
                  '<span class="missing">Missing</span>'} | 
                <strong>Start Date:</strong> ${item.fields[FVS_FIELD_MAPPING.sdate] || '<span class="missing">Missing</span>'} | 
                <strong>End Date:</strong> ${item.fields[FVS_FIELD_MAPPING.edate] || '<span class="missing">Missing</span>'} | 
                <strong>Site:</strong> ${item.fields[FVS_FIELD_MAPPING.site] || '<span class="missing">Missing</span>'} | 
                <strong>Passport No.:</strong> ${item.fields[FVS_FIELD_MAPPING.passport] || '<span class="missing">Missing</span>'} | 
                <strong>Purpose:</strong> ${item.fields[FVS_FIELD_MAPPING.purpose] || '<span class="missing">Missing</span>'}
              </div>
            </div>
          `;
        }
      });
  
      // Add footer
      printContent += `
            <div class="report-footer">
              Total Requests: ${filteredResponses.length} | 
              Generated by: ${userRole.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} | 
              System ID: ${systemId} | 
              Form ID: ${formId}
            </div>
          </body>
        </html>
      `;
  
      // Create a new window and write the content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup window was blocked by the browser');
      }
  
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
  
      // Wait for the content to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      };
    } catch (error) {
      console.error('Error generating print report:', error);
      alert('Failed to generate print report. Please try again and ensure popups are allowed for this site.');
    }
  };

  return (
    <SystemLayout systemId={systemId} formId={formId}>
      <Box p={3}>
        {/* Search Box */}
        <Box mb={3}>
          {/* Search Box */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search requests"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: 190, backgroundColor: 'white' }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />

            {/* Filters */}
            <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white'}}>
              <InputLabel>View Type</InputLabel>
              <Select
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
                label="View Type"
              >
                <MenuItem value={VIEW_TYPES.ALL}>All</MenuItem>
                <MenuItem value={VIEW_TYPES.GROUPS}>Groups</MenuItem>
                <MenuItem value={VIEW_TYPES.SINGLES}>Singles</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 , backgroundColor: 'white'}}>
              <InputLabel>Progress</InputLabel>
              <Select
                value={status}
                onChange={handleStatusChange}
                label="Progress"
              >
                <MenuItem value="">All</MenuItem>
                {progressOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white' }}>
              <InputLabel>Approval</InputLabel>
              <Select
                value={approved}
                onChange={handleApprovalChange}
                label="Approval"
              >
                <MenuItem value="">All</MenuItem>
                {approvalOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From"
                value={fromDate}
                onChange={setFromDate}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: { width: 120, backgroundColor: 'white' } 
                  } 
                }}
              />
              <DatePicker
                label="To"
                value={toDate}
                onChange={setToDate}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: { width: 120, backgroundColor: 'white' } 
                  } 
                }}
              />
            </LocalizationProvider>

            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
              disabled={!status && !approved && !fromDate && !toDate && !searchQuery}
            >
              Clear
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrintReport}
              disabled={loading || filteredResponses.length === 0}
              sx={{ ml: 'auto', width: '160px' }}
            >
              Print Results
            </Button>
          </Box>

          {/* Sorting and Expand Controls */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">Sort by:</Typography>
              {Object.entries(SORT_OPTIONS).map(([field, label]) => (
                <Button
                  key={field}
                  size="small"
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
                  {label} {sortField === field}
                  {/* && (sortDirection === 'asc' ? '↑' : '↓') */}
                </Button>
              ))}
            </Box>

            <Box display="flex" gap={1}>
              <Button
                size="small"
                sx={{width: 230}}
                variant="outlined"
                onClick={() => {
                  const anyExpanded = Object.values(expandedGroups).some(v => v);
                  anyExpanded ? collapseAllGroups() : expandAllGroups();
                }}
                disabled={viewType === VIEW_TYPES.SINGLES}
                startIcon={
                  Object.values(expandedGroups).some(v => v) ? 
                    <ExpandLessIcon /> : 
                    <ExpandMoreIcon />
                }
              >
                {Object.values(expandedGroups).some(v => v) ? 'Collapse All Groups' : 'Expand All Groups'}
              </Button>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <List sx={{backgroundColor: 'white', paddingRight: 2}}>
              {paginatedResponses.map(item => 
                item.isGroup ? renderGroup(item) : renderStandaloneResponse(item)
              )}
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
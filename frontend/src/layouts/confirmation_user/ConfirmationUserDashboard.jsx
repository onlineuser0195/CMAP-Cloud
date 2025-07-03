import React, { useState, useRef } from 'react';
import DatePicker from 'react-datepicker';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/layouts/confirmation_user/ConfirmationUserDashboard.css';
import { formatDate } from "../../utils/util";
import { useEffect } from 'react';
import { confirmationUserAPI } from '../../api/api';
import useAuth from '../../hooks/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { FaTimes } from 'react-icons/fa';
import { AddCircleOutline } from '@mui/icons-material';
import ConfirmationUserStepper from '../../components/stepper/ConfirmationUserStepper';
import EmbassyUserStepper from '../../components/stepper/EmbassyUserStepper';
import ApproverStepper from '../../components/stepper/ApproverStepper';
import { logEvent } from '../../services/logger';

const ConfirmationUserDashboard = () => {
    const { userId } = useAuth();
    const [allVisits, setAllVisits] = useState([]);
    const [facilityLocation, setFacilityLocation] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);
    const [showDateRangePicker, setShowDateRangePicker] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [remarks, setRemarks] = useState({});
    const [visitFilter, setVisitFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await confirmationUserAPI.getVisitsForConfirmationUser(userId);
                setAllVisits(response);
                setFacilityLocation(response?.[0]?.location || '');
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    // Format date to YYYY-MM-DD for comparison
    const formatDateKey = (date) => date.toISOString().split('T')[0];
    const todayKey = formatDateKey(new Date());
    const startDateKey = formatDateKey(startDate);
    const endDateKey = formatDateKey(endDate);

    // Check if a visit window overlaps with the selected date range
    const isDateInRange = (visitStart, visitEnd) => {
        const visitStartStr = visitStart && visitStart.split('T')[0];
        const visitEndStr = visitEnd && visitEnd.split('T')[0];

        return (
            (visitStartStr <= endDateKey && visitEndStr >= startDateKey)
        );
    };

    // Get visits for the selected date range
    const getFilteredVisits = () => {
        return allVisits.filter(visit => {
            // First filter by date range
            const shouldShow = isDateInRange(visit.start_date, visit.end_date);

            if (!shouldShow) return false;

            // Then apply type filter if not 'all'
            if (visitFilter !== 'all' && visit.type !== visitFilter) return false;

            // Then apply search query if any
            if (searchQuery.trim() === '') return true;

            const query = searchQuery.toLowerCase();

            // Match group_id (only for group visits)
            if (visit.type === 'group' && visit.group_id.toLowerCase().includes(query)) {
                return true;
            }

            if (visit.purpose.toLowerCase().includes(query)) {
                return true;
            }

            // Match within all visitors (applies to both single and group visits)
            return visit.visitors.some(visitor =>
                visitor.visitor_name.toLowerCase().includes(query) ||
                visitor.passport_number.toLowerCase().includes(query)
            );
        });
    };

    const filteredVisits = getFilteredVisits();

    // Check if viewing today's visits only
    const isViewingToday = startDateKey === todayKey && endDateKey === todayKey;

    // Toggle group details view
    const toggleGroup = (groupId) => {
        setExpandedGroup(expandedGroup === groupId ? null : groupId);
    };

    // Handle status change for group visitor
    const handleVisitorStatusChange = async (visitId, visitorId, status) => {
        try {
            setUpdating(true);
            await confirmationUserAPI.updateVisitorStatus(visitId, visitorId, status, userId);

            setAllVisits(prev =>
                prev.map(visit => {
                    if (visit._id === visitId) {
                        const updatedVisitors = visit.visitors.map(visitor =>
                            visitor._id === visitorId ? { ...visitor, status } : visitor
                        );

                        return {
                            ...visit,
                            visitors: updatedVisitors,
                        };
                    }
                    return visit;
                })
            );
            logEvent(userId, 'Visit Status updated', { status, systemId: '2', formId: '9' });
            toast.success(`Visitor status updated to ${status}`);
            setUpdating(false);
        } catch (error) {
            setUpdating(false);
            toast.error(error.message);
        }
    };

    // Handle remarks change
    const handleRemarksChange = (id, value) => {
        setRemarks({
            ...remarks,
            [id]: {
                value,
                isCleared: value === ''
            }
        });
    };

    const getRemarksValue = (visit) => {
        return remarks[visit._id]?.isCleared
            ? ''
            : remarks[visit._id]?.value ?? visit.remarks ?? '';
    }

    // Save remarks for a visit
    const saveRemarks = async (visitId) => {
        const newRemark = remarks[visitId]?.value || '';

        try {
            setUpdating(true);
            await confirmationUserAPI.updateVisitRemarks(visitId, newRemark);

            setAllVisits(prev =>
                prev.map(visit =>
                    visit._id === visitId ? { ...visit, remarks: newRemark } : visit
                )
            );

            // Clear the remarks input
            setRemarks({
                ...remarks,
                [visitId]: ''
            });

            toast.success(`Remarks saved successfully`);
            setUpdating(false);
        } catch (error) {
            setUpdating(false);
            toast.error(error.message);
        }
    };

    // Format date for display
    const formatDisplayDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const generateObjectId = () => {
        const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
        const random = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () =>
            Math.floor(Math.random() * 16).toString(16)
        );
        return timestamp + random;
    };

    const formatVisitStatus = (status) => {
        if (!status) return '';
        return status
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    if (loading) {
        return <p className='m-2'>Loading visits...</p>;
    }

    if (error) {
        return <p className="error-message mt-4">{error}</p>;
    }

    return (
        <div>
            <ConfirmationUserStepper currentStageIndex={4} /><br /><br />

            <div className="container py-4">
                <div className=' conf-div'>
                    <Button size="small" variant='contained' sx={{ textTransform: 'none' }} startIcon={<AddCircleOutline fontSize="small" />}
                        onClick={() =>
                            navigate(`/systems/2/form/9/response/${generateObjectId()}`
                            )}>
                        New Visit Request
                    </Button>

                    <div className="mt-4">
                        <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Facility Location: <strong>{facilityLocation}</strong>
                        </small>
                    </div>

                    {/* Date Range Selection */}
                    <div className="mb-4 d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">
                            {isViewingToday
                                ? `Visits for ${formatDisplayDate(startDate)}`
                                : `Visits from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`
                            }
                        </h4>
                        <div className="d-flex gap-2">
                            {!isViewingToday && (
                                <Button size="small" variant='contained'
                                    sx={{ textTransform: 'none' }}
                                    startIcon={<AccessTimeIcon fontSize="small" />}
                                    onClick={() => {
                                        const today = new Date();
                                        setStartDate(today);
                                        setEndDate(today);
                                        setShowDateRangePicker(false);
                                    }}
                                >
                                    Today's Visits
                                </Button>
                            )}
                            <div className="position-relative">
                                <Button size="small" variant='contained'
                                    sx={{ textTransform: 'none' }}
                                    startIcon={<CalendarMonthIcon fontSize="small" />}
                                    onClick={() => {
                                        setTempStartDate(startDate);
                                        setTempEndDate(endDate);
                                        setShowDateRangePicker(!showDateRangePicker)
                                    }}
                                >
                                    <i className="bi bi-calendar"></i>
                                    Select Visits
                                </Button>

                                {showDateRangePicker && (
                                    <div className="date-range-picker-popup p-3 bg-white shadow rounded">
                                        <button
                                            className="date-picker-close-btn"
                                            onClick={() => setShowDateRangePicker(false)}
                                        >
                                            <FaTimes />
                                        </button>
                                        <div className="mb-2">
                                            <label className="form-label">Start Date:</label>
                                            <DatePicker
                                                selected={tempStartDate}
                                                onChange={(date) => setTempStartDate(date)}
                                                maxDate={new Date()}
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label">End Date:</label>
                                            <DatePicker
                                                selected={tempEndDate}
                                                onChange={(date) => setTempEndDate(date)}
                                                minDate={tempStartDate}
                                                maxDate={new Date()}
                                                className="form-control"
                                            />
                                        </div>
                                        <button
                                            className="btn btn-primary w-100"
                                            onClick={() => {
                                                setStartDate(tempStartDate);
                                                setEndDate(tempEndDate);
                                                setShowDateRangePicker(false)
                                            }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-4">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control border-secondary"
                                placeholder="Search visitors or groups..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="btn-group" role="group">
                            {['all', 'single', 'group'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setVisitFilter(type)}
                                    className={`btn visit-filter-btn ${visitFilter === type ? 'active' : ''}`}
                                >
                                    {type === 'all'
                                        ? 'All Visits'
                                        : type === 'single'
                                            ? 'Individual Visits'
                                            : 'Group Visits'}
                                </button>
                            ))}
                        </div>

                    </div>


                    {/* Visit Type Toggle */}
                    {/* <div className="mb-4">
                <div className="btn-group" role="group">
                    <button
                        type="button"
                        className={`btn ${visitFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setVisitFilter('all')}
                    >
                        All Visits
                    </button>
                    <button
                        type="button"
                        className={`btn ${visitFilter === 'single' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setVisitFilter('single')}
                    >
                        Single Visitors
                    </button>
                    <button
                        type="button"
                        className={`btn ${visitFilter === 'group' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setVisitFilter('group')}
                    >
                        Group Visits
                    </button>
                </div>
            </div> */}

                    <div className="row">
                        {filteredVisits.length > 0 ? (
                            filteredVisits.map(visit => (
                                <div key={visit._id} className="col-md-6 mb-4">
                                    <div className="card">
                                        <div className="card-header text-white" style={{ backgroundColor: '#1976d2' }}>
                                            {visit.type === 'single' ? (
                                                <h5>Visitor: {visit.visitors[0]?.visitor_name}</h5>
                                            ) : (
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5>Group: {visit.group_id}</h5>
                                                    <button
                                                        className="btn btn-sm btn-light"
                                                        onClick={() => toggleGroup(visit._id)}
                                                        disabled={updating}
                                                    >
                                                        {expandedGroup === visit._id ? 'Hide Details' : 'Show Details'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-body" style={{ backgroundColor: '#e3f2fd' }}>
                                            <div className="row mb-3">
                                                <div className="col-md-6">
                                                    <p><strong>Visit Window:</strong> {formatDate(visit.start_date)} - {formatDate(visit.end_date)}</p>
                                                </div>
                                                <div className="col-md-6">
                                                    <p><strong>Purpose:</strong> {visit.purpose}</p>
                                                </div>
                                            </div>

                                            {visit.type === 'single' ? (
                                                <>
                                                    <div className="row mb-3">
                                                        <div className="col-md-6">
                                                            <p><strong>Passport:</strong> {visit.visitors[0]?.passport_number}</p>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <p><strong>Status:</strong>
                                                                <span className={`badge ${visit.visitors[0]?.status === 'visited' ? 'bg-success' : 'bg-danger'} ms-2`}>
                                                                    {formatVisitStatus(visit.visitors[0]?.status)}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label htmlFor={`remarks-${visit._id}`} className="form-label">Remarks:</label>
                                                        <textarea
                                                            id={`remarks-${visit._id}`}
                                                            className="form-control custom-textarea"
                                                            value={getRemarksValue(visit)}
                                                            onChange={(e) => handleRemarksChange(visit._id, e.target.value)}
                                                            rows="2"
                                                            disabled={updating}
                                                        />
                                                    </div>

                                                    <div className="d-flex justify-content-between">
                                                        <Button
                                                            variant="contained"
                                                            sx={{ textTransform: 'none' }}
                                                            onClick={() => saveRemarks(visit._id)}
                                                            disabled={
                                                                updating ||
                                                                !remarks[visit._id] ||
                                                                remarks[visit._id] === visit.remarks
                                                            }
                                                        >
                                                            Save Remarks
                                                        </Button>
                                                        {isViewingToday && (


                                                            <>
                                                                <Button
                                                                    variant="contained"
                                                                    color={visit.visitors[0]?.status === 'visited' ? 'error' : 'success'}
                                                                    sx={{ textTransform: 'none' }}
                                                                    onClick={() =>
                                                                        handleVisitorStatusChange(
                                                                            visit._id,
                                                                            visit.visitors[0]?._id,
                                                                            visit.visitors[0]?.status === 'visited' ? 'not-visited' : 'visited'
                                                                        )
                                                                    }
                                                                    disabled={updating}
                                                                >
                                                                    {visit.visitors[0]?.status === 'visited' ? 'Undo Visited' : 'Confirm Visit'}
                                                                </Button>
                                                                {/* <button
        className={`btn ${visit.visitors[0]?.status === 'visited' ? 'btn-secondary' : 'btn-success'}`}
        onClick={() => handleVisitorStatusChange(visit._id, visit.visitors[0]?._id, visit.visitors[0]?.status === 'visited' ? 'not-visited' : 'visited')}
        disabled={updating}
    >
        {visit.visitors[0]?.status === 'visited' ? 'Undo Visited' : 'Confirm Visit'}
    </button> */}
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {expandedGroup === visit._id && (
                                                        <div className="group-details mt-3">
                                                            <h6>Group Members:</h6>
                                                            <div className="table-responsive">
                                                                <table className="table table-bordered">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Name</th>
                                                                            <th>Passport</th>
                                                                            <th>Status</th>
                                                                            {isViewingToday && <th>Action</th>}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {visit.visitors.map(visitor => (
                                                                            <tr key={visitor._id}>
                                                                                <td>{visitor.visitor_name}</td>
                                                                                <td>{visitor.passport_number}</td>
                                                                                <td>
                                                                                    <span className={`badge ${visitor.status === 'visited' ? 'bg-success' : 'bg-danger'}`}>
                                                                                        {formatVisitStatus(visitor.status)}
                                                                                    </span>
                                                                                </td>
                                                                                {isViewingToday && (
                                                                                    <td>
                                                                                        <Button
                                                                                            variant="outlined"
                                                                                            size="small"
                                                                                            color={visitor.status === 'visited' ? 'error' : 'success'}
                                                                                            onClick={() =>
                                                                                                handleVisitorStatusChange(
                                                                                                    visit._id,
                                                                                                    visitor._id,
                                                                                                    visitor.status === 'visited' ? 'not-visited' : 'visited'
                                                                                                )
                                                                                            }
                                                                                            disabled={updating}
                                                                                            sx={{
                                                                                                textTransform: 'none',
                                                                                                backgroundColor: '#fff',
                                                                                                borderColor: visitor.status === 'visited' ? '#d13545' : '#1b5e20',
                                                                                                color: visitor.status === 'visited' ? '#d13545' : '#1b5e20',
                                                                                                '&:hover': {
                                                                                                    backgroundColor: visitor.status === 'visited' ? '#d13545' : '#1b5e20',
                                                                                                    color: '#fff',
                                                                                                    borderColor: visitor.status === 'visited' ? '#d13545' : '#1b5e20'
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            {visitor.status === 'visited' ? 'Undo Visited' : 'Confirm Visit'}
                                                                                        </Button>
                                                                                    </td>
                                                                                )}
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            <div className="mb-3">
                                                                <label htmlFor={`remarks-${visit._id}`} className="form-label">Group Remarks:</label>
                                                                <textarea
                                                                    id={`remarks-${visit._id}`}
                                                                    className="form-control custom-textarea"
                                                                    value={getRemarksValue(visit)}
                                                                    onChange={(e) => handleRemarksChange(visit._id, e.target.value)}
                                                                    rows="2"
                                                                    disabled={updating}
                                                                />
                                                            </div>

                                                            <Button
                                                                variant="contained"
                                                                sx={{ textTransform: 'none' }}
                                                                onClick={() => saveRemarks(visit._id)}
                                                                disabled={
                                                                    updating ||
                                                                    !remarks[visit._id] ||
                                                                    remarks[visit._id] === visit.remarks
                                                                }
                                                            >
                                                                Save Group Remarks
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12">
                                <div className="alert alert-info">
                                    {searchQuery.trim() === ''
                                        ? `No ${visitFilter === 'all' ? '' : visitFilter + ' '}visits found ${isViewingToday
                                            ? `for Today ${formatDisplayDate(startDate)}.`
                                            : `between ${formatDisplayDate(startDate)} and ${formatDisplayDate(endDate)}.`
                                        }`
                                        : `No matching ${visitFilter === 'all' ? '' : visitFilter + ' '}visits found for "${searchQuery}" ${isViewingToday
                                            ? `on ${formatDisplayDate(startDate)}.`
                                            : `between ${formatDisplayDate(startDate)} and ${formatDisplayDate(endDate)}.`
                                        }`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationUserDashboard;
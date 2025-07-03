import { useEffect, useState } from "react";
import { fvsAdminAPI } from "../../api/api";
import '../../styles/layouts/fvs_admin/FvsAdminDashboard.css';
import { Typography } from "@mui/material";
import { formatDate } from "../../utils/util";
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import { TRIMMED_ID } from "../../constants/constants";

const FvsAdminDashboard = () => {
    const [visitRequests, setVisitRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [filters, setFilters] = useState({
        location: '',
        visit_type: '',
        request: '',
        approved: '',
        status: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await fvsAdminAPI.getAllVisitRequests();
                setVisitRequests(data);
                setFilteredRequests(data);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = visitRequests.filter((visit) => {
            const { location, visit_type, request, approved, status } = filters;

            return (
                (!location || visit.location === location) &&
                (!visit_type || visit.visit_type === visit_type) &&
                (!request || (request === 'Submitted'
                    ? visit.progress?.toLowerCase() === 'submitted'
                    : visit.progress?.toLowerCase() !== 'submitted')) &&
                (!approved || (visit.progress?.toLowerCase() === 'submitted' && (
                    (approved === 'Yes' && visit.approved === 'true') ||
                    (approved === 'No' && visit.approved === 'false')
                ))) &&
                (!status || (
                    (status === 'Visited' && visit.visit_status === 'visited') ||
                    (status === 'Not Visited' && visit.visit_status === 'not-visited')
                ))
            );
        });

        if (searchTerm) {
            filtered = filtered.filter((visit) =>
                visit.display_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                visit.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                visit.passport_number?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle special fields
                if (sortConfig.key === 'progress') {
                    aValue = aValue?.toLowerCase() === 'submitted' ? 'Yes' : 'No';
                    bValue = bValue?.toLowerCase() === 'submitted' ? 'Yes' : 'No';
                } else if (sortConfig.key === 'approved') {
                    aValue = aValue === 'true' ? 'Yes' : aValue === 'false' ? 'No' : '';
                    bValue = bValue === 'true' ? 'Yes' : bValue === 'false' ? 'No' : '';
                } else if (sortConfig.key === 'visit_status') {
                    aValue = aValue === 'visited' ? 'Visited' : aValue === 'not-visited' ? 'Not Visited' : '';
                    bValue = bValue === 'visited' ? 'Visited' : bValue === 'not-visited' ? 'Not Visited' : '';
                }

                aValue = aValue?.toString().toLowerCase() || '';
                bValue = bValue?.toString().toLowerCase() || '';

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredRequests([...filtered]);
    }, [filters, visitRequests, searchTerm, sortConfig]);

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return {
                    key,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            return { key, direction: 'asc' };
        });
    };

    const getUniqueValues = (key) => {
        return [...new Set(visitRequests.map((v) => v[key]).filter(Boolean))];
    };

    const getSortIcon = (key) => {
        const isActive = sortConfig.key === key;
        const direction = sortConfig.direction;

        return (
            <span className="ms-1 d-flex flex-column align-items-center sort-icon">
                <span style={{ color: isActive && direction === 'asc' ? 'white' : 'gray' }}>▲</span>
                <span style={{ color: isActive && direction === 'desc' ? 'white' : 'gray' }}>▼</span>
            </span>
        );
    };


    if (loading) return <p className='m-2'>Loading visits...</p>;
    if (error) return <p className="error-message mt-4">{error}</p>;

    return (
        <div className="container py-4">
            <Typography variant="h4" align="center" gutterBottom>
                Admin Dashboard
            </Typography>
            <Typography align="center" gutterBottom>
                Foreign Visit Requests
            </Typography>
            <h5 className="mb-3 text-muted">Search and Filter Visit Requests</h5>

            <div className="row mb-3">
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control border-secondary"
                        placeholder="Search by visit id, name or passport number"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="row mb-3">
                {/* Filter dropdowns */}
                {[
                    { label: 'Location', key: 'location' },
                    { label: 'Visit Type', key: 'visit_type' }
                ].map(({ label, key }) => (
                    <div className="col" key={key}>
                        <label className="form-label text-muted">{label}</label>
                        <select
                            className="form-select border-secondary"
                            value={filters[key]}
                            onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                        >
                            <option value="">All</option>
                            {getUniqueValues(key).map((val) => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                    </div>
                ))}
                <div className="col">
                    <label className="form-label text-muted">Request Submitted</label>
                    <select
                        className="form-select border-secondary"
                        value={filters.request}
                        onChange={(e) => setFilters({ ...filters, request: e.target.value })}
                    >
                        <option value="">All</option>
                        <option value="Submitted">Yes</option>
                        <option value="Not Submitted">No</option>
                    </select>
                </div>
                <div className="col">
                    <label className="form-label text-muted">Request Approved</label>
                    <select
                        className="form-select border-secondary"
                        value={filters.approved}
                        onChange={(e) => setFilters({ ...filters, approved: e.target.value })}
                    >
                        <option value="">All</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>
                <div className="col">
                    <label className="form-label text-muted">Visit Status</label>
                    <select
                        className="form-select border-secondary"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">All</option>
                        <option value="Visited">Visited</option>
                        <option value="Not Visited">Not Visited</option>
                    </select>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-bordered table-striped">
                    <thead className="table-dark" style={{ fontSize: '0.72rem' }}>
                        <tr>
                            {[
                                { label: 'Visit ID', key: 'visit_id' },
                                { label: 'Visitor', key: 'visitor_name' },
                                { label: 'Passport Number', key: 'passport_number' },
                                { label: 'Facility Location', key: 'location' },
                                { label: 'Purpose', key: 'purpose' },
                                { label: 'Start Date', key: 'start_date' },
                                { label: 'End Date', key: 'end_date' },
                                { label: 'Visit Type', key: 'visit_type' },
                                { label: 'Request Submitted', key: 'progress' },
                                { label: 'Request Approved', key: 'approved' },
                                { label: 'Visit Status', key: 'visit_status' }
                            ].map(({ label, key }) => (
                                <th
                                    key={key}
                                    onClick={() => handleSort(key)}
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                    className={`text-center ${sortConfig.key === key ? 'active-sort' : ''}`}
                                >
                                    <div className="position-relative w-100">
                                        <div className="text-center">{label}</div>
                                        <div style={{ position: 'absolute', top: '50%', right: '-1px', transform: 'translateY(-50%)' }}>
                                            {getSortIcon(key)}
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map((visit) => (
                            <tr key={visit._id}>
                                <td className="text-center">{visit.display_id.slice(-TRIMMED_ID) || '-'}</td>
                                <td className="text-center">{visit.visitor_name || '-'}</td>
                                <td className="text-center">{visit.passport_number || '-'}</td>
                                <td className="text-center">{visit.location || '-'}</td>
                                <td className="text-center">{visit.purpose || '-'}</td>
                                <td className="text-center">{formatDate(visit.start_date) || '-'}</td>
                                <td className="text-center">{formatDate(visit.end_date) || '-'}</td>
                                <td className="text-center">
                                    {visit.visit_type === 'Single'
                                        ? <Chip label="Single" color="primary" icon={<PersonIcon />} size="small" />
                                        : visit.visit_type === 'Group'
                                            ? <Chip label="Group" color="secondary" icon={<GroupIcon />} size="small" />
                                            : '-'
                                    }
                                </td>
                                <td className="text-center">
                                    <Chip
                                        label={visit.progress?.toLowerCase() === 'submitted' ? 'Yes' : 'No'}
                                        color={visit.progress?.toLowerCase() === 'submitted' ? 'success' : 'error'}
                                        icon={
                                            visit.progress?.toLowerCase() === 'submitted'
                                                ? <CheckCircleIcon />
                                                : <CancelIcon />
                                        }
                                        variant="filled"
                                        size="small"
                                    />
                                </td>

                                <td className="text-center">
                                    {visit.progress?.toLowerCase() === 'submitted' ? (
                                        visit.approved === 'true' ?
                                            <Chip label="Yes" color="success" icon={<CheckCircleIcon />} size="small" />
                                            : visit.approved === 'false' ? <Chip label="No" color="error" icon={<CancelIcon />} size="small" />
                                                : '-'
                                    ) : '-'
                                    }
                                </td>

                                <td className="text-center">
                                    {visit.visit_status === 'visited' ?
                                        <Chip label="Visited" color="success" icon={<CheckCircleIcon />} size="small" />
                                        : visit.visit_status === 'not-visited' ?
                                            <Chip label="Not Visited" color="error" icon={<CancelIcon />} size="small" /> : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FvsAdminDashboard;

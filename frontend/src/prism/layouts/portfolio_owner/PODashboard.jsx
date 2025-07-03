import { useEffect, useState } from "react";
import { POAPI } from "../../api/api";
import '../../../styles/layouts/fvs_admin/FvsAdminDashboard.css';
import { Typography } from "@mui/material";
import { formatDate } from "../../../utils/util";
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import { PRISM_FIELD_MAPPING, TRIMMED_ID } from "../../../constants/constants";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const PODashboard = () => {
    const location = useLocation(); 
    const { formId } = useParams();
    const systemId = location.state?.systemId;
    const [projectDetails, setProjectDetails] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [filters, setFilters] = useState({
        request: '',
        approved: '',
        status: ''
    });
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log(systemId);
                const data = await POAPI.getAllProjectDetails();
                setProjectDetails(data);
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
        let filtered = projectDetails.filter((visit) => {
            const { request, approved, status } = filters;

            return (
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
            filtered = filtered.filter((project) =>
                project.display_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                } else if (sortConfig.key === 'government_lead') {
                    aValue = a?.fields?.[PRISM_FIELD_MAPPING.governmentLead]?.name ?? '';
                    bValue = b?.fields?.[PRISM_FIELD_MAPPING.governmentLead]?.name ?? '';
                }

                aValue = aValue?.toString().toLowerCase() || '';
                bValue = bValue?.toString().toLowerCase() || '';

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredRequests([...filtered]);
    }, [filters, projectDetails, searchTerm, sortConfig]);

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
        return [...new Set(projectDetails.map((v) => v[key]).filter(Boolean))];
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

    const statusColors = {
        'Completed': 'success',
        'In Progress': 'info',
        'Not Started': 'warning',
        'On Hold': 'error',
    };

    const getProjectStatus = (status) => {
        if (status) {
            return <Chip label={status} color={statusColors[status]} sx={{ minWidth: 80, justifyContent: 'center' }} size="small" />;
        }
        return '-';
    };

    const getGovLead = (proj) => {
        return proj?.fields?.[PRISM_FIELD_MAPPING.governmentLead]?.name ?? "-";
    };


    if (loading) return <p className='m-2'>Loading visits...</p>;
    if (error) return <p className="error-message mt-4">{error}</p>;

    return (
        <div className="container py-4">
            <Typography variant="h4" align="center" gutterBottom>
                Portfolio Owner Dashboard
            </Typography>
            <Typography align="center" gutterBottom>
                Projects Overview
            </Typography>
            <h5 className="mb-3 text-muted">Search and Filter Projects</h5>

            <div className="row mb-3">
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control border-secondary"
                        placeholder="Search by Project ID or Name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-bordered table-striped">
                    <thead className="table-dark" style={{ fontSize: '0.72rem' }}>
                        <tr>
                            {[
                                { label: 'Project ID', key: 'display_id' },
                                { label: 'Project Name', key: 'project_name' },
                                { label: 'Government Lead', key: 'government_lead' },
                                { label: 'Project Type', key: 'project_type' },
                                { label: 'Start Date', key: 'planned_start_date' },
                                { label: 'End Date', key: 'planned_end_date' },
                                { label: 'Project Status', key: 'project_status' },
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

                            <th className={`text-center`}>
                                <div className="position-relative w-100">
                                    <div className="text-center">Action</div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map((project) => (
                            <tr key={project._id}>
                                <td className="text-center">{project.display_id.slice(-TRIMMED_ID) || '-'}</td>
                                <td className="text-center">{project.project_name || '-'}</td>
                                <td className="text-center">{getGovLead(project)}</td>
                                <td className="text-center">{project.project_type || '-'}</td>
                                <td className="text-center">{project.fields[PRISM_FIELD_MAPPING.plannedStartDate] || '-'}</td>
                                <td className="text-center">{project.fields[PRISM_FIELD_MAPPING.plannedEndDate] || '-'}</td>
                                <td className="text-center">{getProjectStatus(project.project_status)}</td>
                                <td className="text-center">
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => {
                                        var url = `/systems/${systemId}/prism-form/${formId}/response/${project._id}`
                                        navigate(url);
                                    }}                                            >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PODashboard;

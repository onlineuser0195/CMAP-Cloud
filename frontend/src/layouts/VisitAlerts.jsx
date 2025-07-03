import { Typography, Button } from "@mui/material";
import { useEffect, useState } from "react";
import { fvsAdminAPI } from "../api/api";
import { TextField, InputAdornment } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SyncIcon from '@mui/icons-material/Sync';
import BarChartIcon from '@mui/icons-material/BarChart';
import DatePicker from 'react-datepicker';
import { toast } from "react-toastify";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    Label,
} from 'recharts';


const VisitAlerts = () => {
    const [visitAlerts, setVisitAlerts] = useState([]);
    const [filteredAlerts, setFilteredAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const dailyChartData = filteredAlerts.reduce((acc, alert) => {
        const date = new Date(alert.submitted_on).toISOString().split('T')[0]; // format: YYYY-MM-DD
        const existing = acc.find(entry => entry.date === date);
        if (existing) {
            existing.count += alert.submission_count || 0;
        } else {
            acc.push({ date, count: alert.submission_count || 0 });
        }
        return acc;
    }, []);




    useEffect(() => {
        const fetchData = async () => {
            try {
                fetchAlerts();

                const today = new Date();
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(today.getMonth() - 1);
                setStartDate(oneMonthAgo.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchAlerts = async () => {
        try {
            const data = await fvsAdminAPI.getVisitRequestsAlert();
            setVisitAlerts(data);
            setFilteredAlerts(data);
            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };


    const getValueByPath = (obj, path) => {
        if (path === 'submitted_by.full_name') {
            const first = obj.submitted_by?.first_name || '';
            const last = obj.submitted_by?.last_name || '';
            return `${first} ${last}`.toLowerCase().trim();
        }
        return path.split('.').reduce((acc, key) => acc?.[key], obj);
    };

    useEffect(() => {
        let filtered = [...visitAlerts];

        // Filter by date range
        if (startDate) {
            const start = getDateOnly(startDate);
            filtered = filtered.filter(alert =>
                getDateOnly(alert.submitted_on) >= start
            );
        }

        if (endDate) {
            const end = getDateOnly(endDate);
            filtered = filtered.filter(alert =>
                getDateOnly(alert.submitted_on) <= end
            );
        }


        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = getValueByPath(a, sortConfig.key);
                let bValue = getValueByPath(b, sortConfig.key);

                aValue = aValue?.toString().toLowerCase() || '';
                bValue = bValue?.toString().toLowerCase() || '';

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredAlerts(filtered);
    }, [visitAlerts, sortConfig, startDate, endDate])

    const getDateOnly = (date) => {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };


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

    if (loading) return <p className='m-2'>Loading alerts...</p>;
    if (error) return <p className="error-message mt-4">{error}</p>;

    const trainModel = async () => {
        try {
            await fvsAdminAPI.startModelTraining();
            toast.success(`Model Training Completed`);
        } catch (error) {
            console.log(error);
            toast.error(`Model Training Failed`);
        }
    };

    const testModel = async () => {
        try {
            await fvsAdminAPI.startDataTesting();
            toast.success(`Model Testing Completed`);
            await fetchAlerts();
        } catch (error) {
            console.log(error);
            toast.error(`Model Testing Failed`);
        }
    };



    return (
        <div className="container py-4">
            <Typography variant="h4" align="center" gutterBottom>
                Admin Dashboard
            </Typography>
            <Typography align="center" gutterBottom>
                Foreign Visit Submission Alerts
            </Typography>

            <Button variant="contained" color="success" sx={{ textTransform: 'none', mr: 2 }} startIcon={<SyncIcon />} onClick={trainModel}>
                Train Model
            </Button>
            <Button variant="contained" color="success" sx={{ textTransform: 'none' }} startIcon={<BarChartIcon />} onClick={testModel}>
                Find Outliers in last 7 days
            </Button>
            <br></br>
            <br></br>

            <h5 className="mb-3 text-muted">Filter Alerts by Date Range</h5>

            <div className="row mb-3 align-items-end">
                <div className="col-auto mb-2">
                    <label className="form-label me-1">Start Date: </label>
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        maxDate={new Date()}
                        className="form-control"
                    />
                </div>
                <div className="col-auto mb-2">
                    <label className="form-label me-1">End Date: </label>
                    <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        maxDate={new Date()}
                        className="form-control"
                    />
                </div>
            </div>


            <div className="mb-5">
                <Typography variant="h6" gutterBottom>
                    Number of Visit Requests Submitted on Each Alert Date
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} >
                            <Label value="Date" offset={-5} position="insideBottom" />
                        </XAxis>
                        <YAxis >
                            <Label
                                value="Requests Submitted"
                                angle={-90}
                                position="insideLeft"
                                style={{ textAnchor: 'middle' }}
                            />
                        </YAxis>
                        <Tooltip />
                        <Bar dataKey="count" fill="#0d47a1" barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>


            <div className="table-responsive">
                <table className="table table-bordered table-striped">
                    <thead className="table-dark">
                        <tr>
                            <th
                                key='submitted_by'
                                onClick={() => handleSort('submitted_by.full_name')}
                                style={{ cursor: 'pointer', position: 'relative' }}
                                className={`text-center ${sortConfig.key === 'submitted_by.full_name' ? 'active-sort' : ''}`}
                            >
                                <div className="position-relative w-100">
                                    <div className="text-center">Submitted By</div>
                                    <div style={{ position: 'absolute', top: '50%', right: '-1px', transform: 'translateY(-50%)' }}>
                                        {getSortIcon('submitted_by.full_name')}
                                    </div>
                                </div>
                            </th>
                            <th
                                key='email'
                                onClick={() => handleSort('submitted_by.email')}
                                style={{ cursor: 'pointer', position: 'relative' }}
                                className={`text-center ${sortConfig.key === 'submitted_by.email' ? 'active-sort' : ''}`}
                            >
                                <div className="position-relative w-100">
                                    <div className="text-center">Email</div>
                                    <div style={{ position: 'absolute', top: '50%', right: '-1px', transform: 'translateY(-50%)' }}>
                                        {getSortIcon('email')}
                                    </div>
                                </div>
                            </th>
                            <th
                                key='submitted_on'
                                onClick={() => handleSort('submitted_on')}
                                style={{ cursor: 'pointer', position: 'relative' }}
                                className={`text-center ${sortConfig.key === 'submitted_on' ? 'active-sort' : ''}`}
                            >
                                <div className="position-relative w-100">
                                    <div className="text-center">Submitted On</div>
                                    <div style={{ position: 'absolute', top: '50%', right: '-1px', transform: 'translateY(-50%)' }}>
                                        {getSortIcon('submitted_on')}
                                    </div>
                                </div>
                            </th>
                            <th
                                key='submission_count'
                                onClick={() => handleSort('submission_count')}
                                style={{ cursor: 'pointer', position: 'relative' }}
                                className={`text-center ${sortConfig.key === 'submission_count' ? 'active-sort' : ''}`}
                            >
                                <div className="position-relative w-100">
                                    <div className="text-center">Requests Submitted</div>
                                    <div style={{ position: 'absolute', top: '50%', right: '-1px', transform: 'translateY(-50%)' }}>
                                        {getSortIcon('submission_count')}
                                    </div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            filteredAlerts.map((alert) => (
                                <tr key={alert._id}>
                                    <td className="text-center">
                                        {`${alert.submitted_by?.first_name || ''} ${alert.submitted_by?.last_name || ''}`.trim() || '-'}
                                    </td>
                                    <td className="text-center">{alert.submitted_by.email || '-'}</td>
                                    <td className="text-center">
                                        {alert.submitted_on ? new Date(alert.submitted_on).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="text-center">{alert.submission_count || '-'}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VisitAlerts;

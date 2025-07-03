import React, { useEffect, useState } from "react";
import { Typography, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import SyncIcon from '@mui/icons-material/Sync';
import dayjs from "dayjs";
import { ITUserAPI } from "../../api/Api";

const REPORT_TIMES = [
    { label: "Reports as of 3 PM", hour: 15 },
    { label: "Reports as of 12 PM", hour: 12 },
    { label: "Reports as of 9 AM", hour: 9 },
];


const ITUserDashboard = () => {
    const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [reports, setReports] = useState([]);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        const reports = await ITUserAPI.getUsxportsReports();
        setReports(reports);
    };

    const getReportsForTime = (hour) => {
        const cutoff = dayjs(`${selectedDate}T${hour.toString().padStart(2, "0")}:00:00`);
        return reports.filter((r) => dayjs(r.timestamp).isBefore(cutoff.add(1, "second")));
    };

    const handleSort = (key) => {
        setSortConfig((prev) => {
            const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
            return { key, direction };
        });
    };

    const sortedReports = (reports) => {
        const sorted = [...reports];
        if (!sortConfig.key) return sorted;

        sorted.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            // If sorting by timestamp, convert to date
            if (sortConfig.key === 'timestamp') {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async () => {
        try {
            if (!selectedFile) {
                alert("Please select a file before submitting.");
                return;
            }

            const formData = new FormData();
            formData.append("file", selectedFile);

            await ITUserAPI.uploadUsxportsReports(formData);
            await fetchReports();
            setSelectedFile(null);
            alert("Reports uploaded successfully");

        } catch (error) {
            alert(error.message);
        }
    };

    const toggleView = () => {
        setShowUpload((prev) => !prev);
        setSelectedFile(null);
    };

    return (
        <div className="container py-4 min-vh-100 mb-0 pb-0" style={{ backgroundColor: '#F3F2F0', border: '1px solid #BBAA88' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }} className="mb-2 pb-0" align="center">
                IT User Dashboard
            </Typography>

            {/* Centered heading */}
            <div className="text-center mb-1">
                <Typography variant="subtitle1" gutterBottom>
                    {showUpload && (
                        <>Upload reports from the <strong>USXPORTS Classic</strong></>
                    )}
                </Typography>

            </div>

            {/* View Reports Controls */}
            {!showUpload && (
                <>
                    <div className="card mb-4" style={{ backgroundColor: '#e8efe9' }}>
                        <div className="card-body d-flex flex-column align-items-center text-center">
                            <Button variant="contained" color="success" size="medium" startIcon={<SyncIcon />} onClick={toggleView}>
                                Sync Reports
                            </Button>
                            <div style={{ fontSize: '0.9rem' }}>
                                Click Sync Reports to upload the latest reports from USXPORTS Classic
                            </div>
                        </div>
                    </div>
                    <div className="mb-2 d-flex flex-column align-items-center">
                        <input
                            type="date"
                            id="datePicker"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                        <div style={{ fontSize: '0.9rem' }}>
                            Select date to view USXPORTS Classic Reports for a specific date
                        </div>
                    </div>
                </>

            )}



            {showUpload ? (
                <div className="mb-4">
                    <label className="form-label"><strong>Upload Excel File</strong></label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="form-control"
                        style={{ 'font-weight': 'bold' }}
                    />
                    <div className="mt-3">
                        <button className="btn btn-secondary me-2" onClick={toggleView}>
                            Back
                        </button>
                        <button className="btn btn-success" onClick={handleSubmit}>
                            Submit
                        </button>
                    </div>
                </div>
            ) : (
                <>

                    {/* Reports Sections */}
                    {REPORT_TIMES.map(({ label, hour }) => (
                        <div key={label} style={{ marginBottom: "2rem", textAlign: "center" }}>
                            <Typography variant="subtitle1" style={{ fontWeight: 'bold' }} color="primary" gutterBottom>
                                {label} on {selectedDate} ({getReportsForTime(hour).length} Reports)
                            </Typography>
                            <Paper style={{ maxHeight: 200, overflow: 'auto' }}>
                                <Table size="small" sx={{ border: '1px solid #BBAA88' }}>
                                    <TableHead sx={{ position: 'sticky', top: -1, zIndex: 1 }}>
                                        <TableRow sx={{ backgroundColor: '#D6D4CE', cursor: 'pointer' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }} onClick={() => handleSort('type')}>
                                                Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Case Number</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Analyst Email</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }} onClick={() => handleSort('case_status')}>
                                                Case Status {sortConfig.key === 'case_status' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }} onClick={() => handleSort('timestamp')}>
                                                Timestamp {sortConfig.key === 'timestamp' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sortedReports(getReportsForTime(hour)).map((report) => (
                                            <TableRow key={report._id}>
                                                <TableCell>{report.type}</TableCell>
                                                <TableCell>{report.case_number}</TableCell>
                                                <TableCell>{report.analyst_email}</TableCell>
                                                <TableCell>{report.case_status}</TableCell>
                                                <TableCell>{dayjs(report.timestamp).format("YYYY-MM-DD HH:mm")}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Paper>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

export default ITUserDashboard;

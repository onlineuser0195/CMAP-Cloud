import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import dayjs from "dayjs";
import { ITUserAPI, SpanSupportUserAPI } from "../../api/Api";
import * as XLSX from "xlsx";

const SpanSupportUserDashboard = () => {
    const [reports, setReports] = useState([]);
    const [syncTime, setSyncTime] = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });


    useEffect(() => {
        const fetchData = async () => {
            const data = await SpanSupportUserAPI.getLastSyncTimeForUsxportsReport();
            setSyncTime(data.last_sync_time);
        };

        fetchData();
        fetchReports();
    }, []);

    const fetchReports = async () => {
        const reports = await ITUserAPI.getUsxportsReports();
        setReports(reports);
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

            await SpanSupportUserAPI.uploadSpanReports(formData);
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

    const handleDownloadReports = () => {
        const cleanedReports = reports.map(({ _id, __v, ...rest }) => rest);

        const worksheet = XLSX.utils.json_to_sheet(cleanedReports);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

        const formattedSyncTime = dayjs(syncTime).format("YYYY-MM-DD_HH-mm");
        XLSX.writeFile(workbook, `Reports_${formattedSyncTime}.xlsx`);
    };

    const handleViewClick = (report) => {
        setSelectedCase(report);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedCase(null);
    };

    const sortedReports = [...reports].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === 'received_date') {
            return sortConfig.direction === 'asc'
                ? new Date(aValue) - new Date(bValue)
                : new Date(bValue) - new Date(aValue);
        }

        const aStr = aValue?.toString().toLowerCase() || '';
        const bStr = bValue?.toString().toLowerCase() || '';

        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };



    return (
        <div className="container py-4 min-vh-100" style={{ backgroundColor: '#F3F2F0', border: '1px solid #BBAA88' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }} align="center">
                SPAN Support User Dashboard
            </Typography>

            <br />

            {/* Centered heading */}
            <div className="text-center mb-3">
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {showUpload ? "UPLOAD SPAN REPORTS" : "MANAGE REPORTS"}
                </Typography>
                <Typography variant="subtitle1" >
                    {showUpload ? <>Upload SPAN Reports from low-side location to a secure high-side</> : <></>}
                </Typography>
            </div>

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
                    {/* Report Status Section */}
                    <div className="card mb-2" style={{ backgroundColor: '#e8efe9' }}>
                        <div
                            className="card-body d-flex justify-content-center text-center"
                            style={{ gap: '2rem' }}
                        >
                            {/* Column 1: Download */}
                            <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '1rem' }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    sx={{ textTransform: 'none' }}
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDownloadReports}
                                >
                                    Download USXPORTS Reports
                                </Button>

                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ fontWeight: 'bold', color: 'red', marginRight: '0.5rem' }}>
                                        Last Sync Time:
                                    </label>
                                    <span>{syncTime ? dayjs(syncTime).format("MMM D, YYYY h:mm A") : "Not available"}</span>
                                </div>

                                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    Reports are periodically synced from the USXPORTS Classic
                                </div>
                            </div>

                            {/* Column 2: Upload */}
                            <div style={{ flex: 1, paddingLeft: '1rem' }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    sx={{ textTransform: 'none' }}
                                    startIcon={<UploadIcon />}
                                    onClick={toggleView}
                                >
                                    Upload SPAN Reports
                                </Button>

                                <div style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                                    Upload SPAN Reports from low-side location to a secure high-side
                                </div>
                            </div>
                        </div>
                    </div>


                    <br></br>

                    <div className="d-flex align-items-center mb-3 position-relative" style={{ minHeight: '40px' }}>
                        {/* Absolutely Centered Heading */}
                        <h5 className="position-absolute start-50 translate-middle-x m-0">
                            USXPORTS Classic Reports
                        </h5>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-bordered table-hover">
                            <thead className="table-light text-center">
                                <tr>
                                    <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>
                                        Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th>Case Number</th>
                                    <th>Analyst Email</th>
                                    <th onClick={() => handleSort('case_status')} style={{ cursor: 'pointer' }}>
                                        Case Status {sortConfig.key === 'case_status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('received_date')} style={{ cursor: 'pointer' }}>
                                        Date Received {sortConfig.key === 'received_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Replace this with dynamic report data */}
                                {sortedReports.map((report) => (
                                    <tr key={report._id} className="text-center">
                                        <td>{report.type}</td>
                                        <td>{report.case_number}</td>
                                        <td>{report.analyst_email}</td>
                                        <td className="text-center">
                                            {report.case_status === 'Open' ? (
                                                <Chip label="Open" color="success" size="small" sx={{ width: 80, justifyContent: 'center' }} />
                                            ) : report.case_status === 'Closed' ? (
                                                <Chip label="Closed" color="primary" size="small" sx={{ width: 80, justifyContent: 'center' }} />
                                            ) : report.case_status === 'Pending' ? (
                                                <Chip label="Pending" color="warning" size="small" sx={{ width: 80, justifyContent: 'center' }} />
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td>{dayjs(report.received_date).format("YYYY-MM-DD HH:mm")}</td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewClick(report)}                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
                        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>CASE DETAILS</DialogTitle>
                        <DialogContent dividers>
                            {selectedCase ? (
                                <>
                                    <Typography><strong>Type:</strong> {selectedCase.type || "-"}</Typography>
                                    <br></br>
                                    <Typography><strong>Case Number:</strong> {selectedCase.case_number || "-"}</Typography>
                                    <Typography><strong>Case Status:</strong> {selectedCase.case_status || "-"}</Typography>
                                    <br></br>
                                    <Typography><strong>Date Received:</strong> {selectedCase.received_date ? dayjs(selectedCase.received_date).format("YYYY-MM-DD HH:mm") : "-"}</Typography>
                                    <Typography><strong>Date Closed:</strong> {selectedCase.closed_date ? dayjs(selectedCase.closed_date).format("YYYY-MM-DD HH:mm") : "-"}</Typography>
                                    <br></br>
                                    <Typography><strong>Analyst Name:</strong> {selectedCase.analyst_email || "-"}</Typography>
                                    <Typography><strong>Analyst Phone:</strong> {selectedCase.analyst_phone || "-"}</Typography>
                                    <Typography><strong>Analyst Email:</strong> {selectedCase.analyst_email || "-"}</Typography>
                                    <Typography><strong>Analyst Details:</strong> {selectedCase.analyst_details || "-"}</Typography>
                                    <br></br>
                                    {selectedCase.type === "Dual-Use" && (
                                        <>
                                            <Typography>
                                                <strong>Registration Date:</strong>{" "}
                                                {selectedCase.registration_date
                                                    ? dayjs(selectedCase.registration_date).format("YYYY-MM-DD HH:mm")
                                                    : "-"}
                                            </Typography>
                                            <Typography>
                                                <strong>Reopen Date:</strong>{" "}
                                                {selectedCase.reopen_date
                                                    ? dayjs(selectedCase.reopen_date).format("YYYY-MM-DD HH:mm")
                                                    : "-"}
                                            </Typography>
                                            <br></br>
                                        </>
                                    )}
                                    {selectedCase.type === "Munitions" && (
                                        <>
                                            <Typography>
                                                <strong>Staffed Organization Status:</strong>{" "}
                                                {selectedCase.staffed_organization_status || "-"}
                                            </Typography>
                                            <Typography>
                                                <strong>Organization:</strong>{" "}
                                                {selectedCase.organization || "-"}
                                            </Typography>
                                            <Typography>
                                                <strong>Staffed Date:</strong>{" "}
                                                {selectedCase.staffed_date
                                                    ? dayjs(selectedCase.staffed_date).format("YYYY-MM-DD HH:mm")
                                                    : "-"}
                                            </Typography>
                                            <Typography>
                                                <strong>Reply Date:</strong>{" "}
                                                {selectedCase.reply_date
                                                    ? dayjs(selectedCase.reply_date).format("YYYY-MM-DD HH:mm")
                                                    : "-"}
                                            </Typography>
                                            <br></br>
                                        </>
                                    )}
                                    {selectedCase.type === "CJ" && (
                                        <Typography><strong>Recommendation:</strong> {selectedCase.recommendation || "-"}</Typography>
                                    )}
                                </>
                            ) : (
                                <Typography>No data available</Typography>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button variant="contained" onClick={handleCloseModal} color="primary">
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>

                </>
            )}
        </div>
    );
};

export default SpanSupportUserDashboard;

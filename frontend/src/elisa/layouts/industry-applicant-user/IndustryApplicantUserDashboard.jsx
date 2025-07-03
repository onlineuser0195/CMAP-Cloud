import { useEffect, useState } from "react";
import { Typography, Button, Paper, Box } from "@mui/material";
import { IndustryApplicantUserAPI } from "../../api/Api";
import RefreshIcon from '@mui/icons-material/Refresh';
import dayjs from "dayjs";
import "../../styles/layouts/industry-applicant-user/industry-applicant-user.css";


const IndustryApplicantUserDashboard = () => {
    // const [showDisclaimer, setShowDisclaimer] = useState(true);
    const [activeTab, setActiveTab] = useState("results");
    const [caseNumber, setCaseNumber] = useState("");
    const [caseResult, setCaseResult] = useState(null);
    const [emptyCaseNumber, setEmptyCaseNumber] = useState(false);
    const [resultNotFound, setResultNotFound] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch logic here when disclaimer is accepted
        };

        fetchData();
    }, []);

    // const handleEnterSite = () => {
    //     setShowDisclaimer(false);
    // };

    // if (showDisclaimer) {
    //     return (
    //         <Box
    //             className="min-vh-100 d-flex justify-content-center align-items-center"
    //             style={{ backgroundColor: "#f8f9fa" }}
    //         >
    //             <Paper elevation={3} className="p-4" style={{ maxWidth: 800, width: '100%', textAlign: "center" }}>
    //                 <Typography variant="h3" fontWeight="bold" gutterBottom>
    //                     ELISA
    //                 </Typography>

    //                 <Box
    //                     className="p-3"
    //                     style={{
    //                         border: "2px solid red",
    //                         borderRadius: "2px",
    //                         backgroundColor: "#fff",
    //                         textAlign: "left",
    //                     }}
    //                 >
    //                     <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>
    //                         YOU ARE ENTERING A SECURE SYSTEM
    //                     </Typography>
    //                     <Typography sx={{ fontSize: '13px', lineHeight: 1.2 }} color="text.secondary">
    //                         This Is A CMAP Computer System. This Computer System, Including All Related Equipment, Networks And Network Devices (Specifically Including Internet Access), Are Provided Only For Authorized U.S. Government Use. CMAP Computer Systems May Be Monitored For All Lawful Purposes, Including To Ensure That Their Use Is Authorized, For Management Of The System, To Facilitate Protection Against Unauthorized Access, And To Verify Security Procedures, Survivability And Operational Security. Monitoring Includes Active Attacks By Authorized CMAP Entities To Test Or Verify The Security Of This System. During Monitoring, Information May Be Examined, Recorded, Copied And Used For Authorized Purposes. All Information, Including Personal Information, Placed On Or Sent Over This System May Be Monitored. Use Of This CMAP Computer System, Authorized Or Unauthorized, Constitutes Consent To Monitoring Of This System. Unauthorized Use May Subject You To Criminal Prosecution. Evidence Of Unauthorized Use Collected During Monitoring May Be Used For Administrative, Criminal Or Other Adverse Action. Use Of This System Constitutes Consent To Monitoring For These Purposes.
    //                     </Typography>

    //                     <br />

    //                     <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>
    //                         WELCOME ELISA USERS
    //                     </Typography>
    //                     <Typography sx={{ fontSize: '13px', lineHeight: 1.2 }} color="text.secondary">
    //                         You are about to enter the ELISA website.<br /><br />

    //                         Case status information is copied periodically from a CMAP computer to ELISA only on workdays between 8:00 a.m. and 8:30 a.m. EST. If you consult ELISA after 8:30 a.m., you will see new case status information. Information on closed cases is maintained on ELISA for ten working days.
    //                     </Typography>

    //                     <Box textAlign="center" mt={3}>
    //                         <Button variant="contained" color="primary" onClick={handleEnterSite}>
    //                             Enter Site
    //                         </Button>
    //                     </Box>
    //                 </Box>
    //             </Paper>
    //         </Box>
    //     );
    // };

    const fetchCaseDetails = async () => {
        if (!caseNumber.trim()) {
            setEmptyCaseNumber(true);
            setCaseResult(null);
            setResultNotFound(false);
            return;
        }

        setLoading(true);
        setCaseResult(null);
        setResultNotFound(false);
        setEmptyCaseNumber(false);

        try {
            const res = await IndustryApplicantUserAPI.getCaseDetails(caseNumber.trim());
            setCaseResult(res);
        } catch (error) {
            setResultNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const resultsTab = () => {
        return (
            <Box>
                <Typography variant="body1" fontWeight="bold">
                    Enter the case number, and click submit to retrieve details.
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    If a case is found, the results will be shown below. Click the guidelines tab for hints on formatting the case number.
                </Typography>
                <Box display="flex" gap={2} mb={2}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Case Number"
                        value={caseNumber}
                        onChange={(e) => setCaseNumber(e.target.value)}
                        style={{ maxWidth: "300px" }}
                        required
                    />
                    <Button variant="contained" onClick={fetchCaseDetails}>
                        Submit
                    </Button>
                </Box>

                {emptyCaseNumber && (
                    <Typography variant="body2" color="error" mt={2}>
                        Please enter a case number before submitting.
                    </Typography>
                )}

                {loading && (
                    <Typography variant="body2" color="text.secondary">
                        Fetching results...
                    </Typography>
                )}

                {resultNotFound && (
                    <Typography variant="body2" color="error" mt={2}>
                        No case was found for the input case number. Please double-check and try again.
                    </Typography>
                )}

                {caseResult && (
                    <div className="mt-3">
                        <Typography variant="h6" fontWeight="bold" align="center" sx={{ color: '#2e7d32' }} gutterBottom>
                            CASE DETAILS
                        </Typography>

                        <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap">
                            <div>
                                <label style={{ fontWeight: 'bold', marginRight: '0.5rem', color: 'red' }}>
                                    Last Sync Time:
                                </label>
                                <span>
                                    {caseResult.timestamp
                                        ? dayjs(caseResult.timestamp).format("MMM D, YYYY h:mm A")
                                        : "Not available"}
                                </span>
                                <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: 0 }}>
                                    (Time when case details were synced from the USXPORTS Classic)
                                </p>
                            </div>

                            <div>
                                <Button variant="contained" color="success" size="small" startIcon={<RefreshIcon />} onClick={fetchCaseDetails}>
                                    Refresh
                                </Button>
                            </div>
                        </div>




                        {/* Row 1 */}
                        <div className="row mb-4">
                            <div className="col-4">
                                <label><strong>Type:</strong></label>
                                <input type="text" className="form-control" value={caseResult.type || "-"} readOnly />
                            </div>
                            <div className="col-4">
                                <label><strong>Case Number:</strong></label>
                                <input type="text" className="form-control" value={caseResult.case_number || "-"} readOnly />
                            </div>
                            <div className="col-4">
                                <label><strong>Case Status:</strong></label>
                                <input type="text" className="form-control" value={caseResult.case_status || "-"} readOnly />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="row mb-4">
                            <div className="col-4">
                                <label><strong>Date Received:</strong></label>
                                <input type="text" className="form-control" value={caseResult.received_date
                                    ? dayjs(caseResult.received_date).format("YYYY-MM-DD HH:mm")
                                    : "-"} readOnly />
                            </div>
                            <div className="col-4">
                                <label><strong>Date Closed:</strong></label>
                                <input type="text" className="form-control" value={caseResult.closed_date
                                    ? dayjs(caseResult.closed_date).format("YYYY-MM-DD HH:mm")
                                    : "-"} readOnly />
                            </div>
                            <div className="col-4"></div>
                        </div>

                        {/* Row 3 */}
                        <div className="row mb-4">
                            <div className="col-4">
                                <label><strong>Analyst Name:</strong></label>
                                <input type="text" className="form-control" value={
                                    caseResult.analyst_first_name || caseResult.analyst_last_name
                                        ? `${caseResult.analyst_first_name || ""} ${caseResult.analyst_last_name || ""}`.trim()
                                        : "-"
                                } readOnly />
                            </div>
                            <div className="col-4">
                                <label><strong>Analyst Email:</strong></label>
                                <input type="text" className="form-control" value={caseResult.analyst_email || "-"} readOnly />
                            </div>
                            <div className="col-4">
                                <label><strong>Analyst Phone:</strong></label>
                                <input type="text" className="form-control" value={caseResult.analyst_phone || "-"} readOnly />
                            </div>
                        </div>

                        {/* Row 4 - Analyst Details */}
                        <div className="row">
                            <div className="col-4">
                                <label><strong>Analyst Details:</strong></label>
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-12">
                                <textarea
                                    className="form-control"
                                    value={caseResult.analyst_details || "-"}
                                    rows={3}
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Row 6 */}
                        <div className="row mb-4">
                            <Typography variant="body1" fontWeight="bold" color="primary">
                                Specific to Dual-Use Cases
                            </Typography>
                            <div className="col-4">
                                <label><strong>Registration Date:</strong></label>
                                <input type="text" className="form-control" value={caseResult.registration_date
                                    ? dayjs(caseResult.registration_date).format("YYYY-MM-DD HH:mm")
                                    : "-"} readOnly />
                            </div>
                            <div className="col-4">
                                <label><strong>Reopen Date:</strong></label>
                                <input type="text" className="form-control" value={caseResult.reopen_date
                                    ? dayjs(caseResult.reopen_date).format("YYYY-MM-DD HH:mm")
                                    : "-"} readOnly />
                            </div>
                            <div className="col-4"></div>
                        </div>

                        {/* Row 7 */}
                        <div className="row mb-2">
                            <Typography variant="body1" fontWeight="bold" color="primary">
                                Specific to Munitions Cases
                            </Typography>
                            <div className="col-4">
                                <label><strong>Staffed Organization Status:</strong></label>
                                <input type="text" className="form-control" value={caseResult.staffed_organization_status || "-"} readOnly />
                            </div>
                            <div className="col-4">
                                <label><strong>Organization:</strong></label>
                                <input type="text" className="form-control" value={caseResult.organization || "-"} readOnly />
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-4">
                                <label><strong>Staffed Date:</strong></label>
                                <input type="text" className="form-control" value={caseResult.staffed_date
                                    ? dayjs(caseResult.staffed_date).format("YYYY-MM-DD HH:mm")
                                    : "-"} readOnly />
                            </div>
                            <div className="col-4">
                                <label><strong>Reply Date:</strong></label>
                                <input type="text" className="form-control" value={caseResult.reply_date
                                    ? dayjs(caseResult.reply_date).format("YYYY-MM-DD HH:mm")
                                    : "-"} readOnly />
                            </div>
                        </div>

                        {/* Row 8 - Recommendation */}
                        <div className="row">
                            <Typography variant="body1" fontWeight="bold" color="primary">
                                Specific to CJ Cases
                            </Typography>
                            <div className="col-4">
                                <label><strong>Recommendation:</strong></label>
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-12">
                                <textarea
                                    className="form-control"
                                    value={caseResult.recommendation || "-"}
                                    rows={3}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="row mb-2">
                            <div className="col-4">
                                <label><strong>Final Date:</strong></label>
                                <input type="text" className="form-control" value={caseResult.final_date
                                    ? dayjs(caseResult.final_date).format("YYYY-MM-DD HH:mm")
                                    : "-"} readOnly />
                            </div>
                            <div className="col-8"></div>
                        </div>
                    </div>
                )}

            </Box>
        );
    };

    const guidelinesTab = () => {
        return (
            <div>
                <Typography variant="body1" paragraph>
                    Make sure to follow the application guidelines carefully. Incomplete submissions will not be processed.
                </Typography>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Formatting Hints
                </Typography>

                <ul className="ps-3">
                    <li>
                        <Typography variant="body2">
                            For <strong>Munitions</strong> or <strong>CJ</strong> cases, enter the case number with any prefix and punctuation.
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            For <strong>Dual-Use</strong> filings, enter the Application Control Number (ACN) with any prefix.
                        </Typography>
                    </li>
                </ul>
            </div>
        );
    };

    const contactTab = () => {
        return (
            <Typography variant="body1">
                For any inquiries, contact SPAN Support at <strong>support.elisa@mail.mil</strong> or call <strong>1-800-123-4567</strong>.
            </Typography>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case "results":
                return resultsTab();
            case "guidelines":
                return guidelinesTab();
            case "contact":
                return contactTab();
            default:
                return null;
        }
    };

    return (
        <div
            className="container py-4 min-vh-100"
            style={{ backgroundColor: "#F3F2F0", border: "1px solid #BBAA88" }}
        >
            <Typography variant="h4" sx={{ fontWeight: 'bold' }} align="center">
                Industry Applicant User Dashboard
            </Typography>

            <br />

            {/* Tab Buttons */}
            <Paper elevation={2} className="p-3 mb-4">
                <Box display="flex" justifyContent="center" gap={4}>
                    <Button
                        variant={activeTab === "results" ? "contained" : "outlined"}
                        onClick={() => setActiveTab("results")}
                        size="large"
                        sx={{ width: 220, height: 70, fontSize: '1.1rem' }}
                    >
                        Case Search
                    </Button>
                    <Button
                        variant={activeTab === "guidelines" ? "contained" : "outlined"}
                        onClick={() => setActiveTab("guidelines")}
                        size="large"
                        sx={{ width: 200 }}
                    >
                        Guidelines
                    </Button>
                    <Button
                        variant={activeTab === "contact" ? "contained" : "outlined"}
                        onClick={() => setActiveTab("contact")}
                        size="large"
                        sx={{ width: 200 }}
                    >
                        Contact Info
                    </Button>
                </Box>
            </Paper>

            {/* Tab Content */}
            <Paper elevation={1} className="p-3">
                {renderContent()}
            </Paper>
        </div>
    );
};

export default IndustryApplicantUserDashboard;

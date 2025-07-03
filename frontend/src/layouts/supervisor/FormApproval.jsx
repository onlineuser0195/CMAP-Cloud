import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import { formAPI, formResponseAPI, systemAPI, pdfAPI } from '../../api/api';
import '../../styles/layouts/user/FillForm.css';
import {API_URL, FVS_FIELD_MAPPING, TRIMMED_ID, USER_ROLES } from '../../constants/constants';
import useAuth from '../../hooks/AuthContext';
import { Box } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import ApproverStepper from '../../components/stepper/ApproverStepper';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { logEvent } from '../../services/logger';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const FormApproval = () => {
  const { respId, formId, systemId } = useParams();
  const { userRole, mappedRole, userId } = useAuth();
  const [formData, setFormData] = useState({});
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState('not_started');
  const [formDetails, setFormDetails] = useState({ name: '', description: '', systemName: '', file: null});
  const [openInfo, setOpenInfo] = useState(false);
  const handleOpenInfo = () => setOpenInfo(true);
  const handleCloseInfo = () => setOpenInfo(false);
  const [comment, setComment] = useState('');
  const [responseId, setResponseId] = useState(null);
  const [approval, setApproval] = useState(''); // '' means not set, 'true' approved, 'false' disapproved
  const [openPDF, setOpenPDF] = useState(false);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [pdfFieldId, setPdfFieldId] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const handleOpenPDF = (filename, fieldid) => {
    console.log(filename);
    setPdfFileName(filename);
    setPdfFieldId(fieldid);
    setOpenPDF(true);
  }
  const handleClosePDF = () => {
    setOpenPDF(false);
    setPdfFileName(null);
    setPdfFieldId(null);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch form structure
        const formRes = await formAPI.getBuildForm(formId);
        setFields(formRes.data.fields);
        setFormDetails({
          name: formRes.data.name,
          description: formRes.data.description,
          file: formRes.data.info?.file_path || null
        });

        // Fetch response
        const responseRes = await formResponseAPI.getFormResponse(respId, formId, systemId, userId);
        
        setProgress(responseRes.progress);
        setResponseId(responseRes._id); // assuming each response has a unique _id

        // Initialize form data
        const initialData = {};
        formRes.data.fields.forEach(field => {
          const value =
            responseRes.fields[String(field.field_id)] ??
            (field.type === 'checkbox' ? [] : '');
          initialData[field.field_id] = value;
        });
        setFormData(initialData);

        const systemRes = await systemAPI.getSystemDetails(systemId);

        setFormDetails(prev => ({
          ...prev,
          systemName: systemRes.data.name
        }));

        // Get existing comment and approval status if any
        setComment(responseRes.comment || '');
        setApproval(responseRes.approved || '');
        setVisitorId(responseRes.display_id || '');

      } catch (error) {
        console.error('Error:', error);
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [formId]);

  const handleApproval = async (decision) => {
    try {
      await formResponseAPI.updateFormApproval(
        respId,
        formId,
        systemId,
        decision,
        comment,
        userId
      );
      logEvent(userId, 'Request Approval', { decision, systemId, formId, respId });
      // Update state to reflect the approval decision
      setApproval(decision ? 'true' : 'false');
      toast.success(`Request ${decision ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.message);
    }
  };

  const allowResubmission = async (progress) => {
    try {
      await formResponseAPI.updateFormProgress(
        respId,
        formId,
        systemId,
        progress,
        userId
      );
      logEvent(userId, 'Resubmission Allowed', { progress, systemId, formId, respId });
      // Update state to reflect the approval decision
      setProgress('in_progress');
      toast.success(`Request Resubmission Allowed!`);
    } catch (error) {
      console.error('Error allowing resubmission of the form:', error);
      toast.error(error.message);
    }
  }

  const handlePdfSearch = async (filepath, searchText) => {
    try {
      logEvent(userId, 'PDF Search', { filepath, searchText, formId, respId, systemId });
      setIsSearching(true);
      setSearchResults(null); // Clear previous results
      const results = await pdfAPI.searchPDF(
        filepath, // Remove base URL if needed .replace(API_URL, '')
        searchText,
        'scanned',
        systemId
      );
      setSearchResults(results);
    } catch (error) {
      toast.error('Search failed: ' + error.message);
      setSearchResults({ matches: [] });
    } finally {
      setIsSearching(false);
    }
  };

// const [pdfUrl, setPdfUrl] = useState(null);

// useEffect(() => {
//   if (openPDF) {
//     // Fetch PDF using your API function
//     formResponseAPI.getFile(systemId, formId, pdfFileName).then(response => {
//       const blob = new Blob([response.data], { type: 'application/pdf' });
//       const url = URL.createObjectURL(blob);
//       setPdfUrl(url);
//     });
//   }

//   return () => {
//     // Cleanup blob URL
//     if (pdfUrl) {
//       URL.revokeObjectURL(pdfUrl);
//     }
//   };
// }, [openPDF]);
  // Use Like this:
  // {pdfUrl && (
  //   <iframe
  //     src={pdfUrl}

  function getStepperProps(progress, approved) {
    let currentStageIndex;
    let submissionStatus = '';
    let approvalStatus = '';
  
    // Determine current stage
    if (progress === 'not_started') {
      currentStageIndex = 0; // Submitted stage
    } else if (progress === 'in_progress') {
      currentStageIndex = 1;
    } else if (progress==='submitted') {
      currentStageIndex = 2; // Submitted stage
      submissionStatus = 'submitted';
      if (approved === 'true') {
        currentStageIndex = 3; // Approved stage
        approvalStatus = 'approved';
      } else if (approved === 'false') {
        currentStageIndex = 3; // Rejected stage
        approvalStatus = 'rejected';
      }  else {
        currentStageIndex = 2; // Not Reviewed stage
        approvalStatus = '';
      }   
    } 
    // console.log( currentStageIndex, submissionStatus, approvalStatus )
    return { currentStageIndex, submissionStatus, approvalStatus };
  }
  
  const { currentStageIndex, submissionStatus, approvalStatus } = getStepperProps(
    progress,
    approval
  );

  if (isLoading)
    return <div className="text-center mt-5">Loading form...</div>;

  return (
    <>
    <Box textAlign="center" mb={3}>
        {mappedRole === USER_ROLES.SUPERVISOR && 
          <ApproverStepper 
          currentStageIndex={currentStageIndex}
          submissionStatus={submissionStatus}
          approvalStatus={approvalStatus}
        />}
    </Box>
    <div className="form-canvas mx-4 pt-4 d-flex justify-content-center">
      <div>
        <div className="text-center mb-4 pt-5 mt-5">
          { formId !== '0' && mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole !== USER_ROLES.LOCAL_ADMIN && formDetails.file && <Tooltip placement="top-end" title="View Instruction Document">
              <div style={{ position: 'relative' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" onClick={handleOpenInfo} width="16" height="16" fill="currentColor" className="info-icon bi bi-info-circle-fill" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
                  </svg>
              </div>
          </Tooltip>}
          {/* <h2 className="fw-semibold mb-1">{formDetails.name}</h2> */}
          {/* <span className="fw-semibold mb-1">{formDetails.description}</span><br/> */}
          <small className="text-muted">
            {/* System: <strong>{formDetails.systemName}</strong> <br/> */}
            {visitorId!=='' && <> Visitor Req. ID: <strong> {visitorId.slice(-TRIMMED_ID)} </strong> </>}
            {formData[FVS_FIELD_MAPPING.fname] && <> | Name: <strong>{formData[FVS_FIELD_MAPPING.fname]} {formData[FVS_FIELD_MAPPING.mi]} {formData[FVS_FIELD_MAPPING.lname]}</strong></>}
            <br/>
            {progress === 'submitted' && (<div> Approval Status: 
              {approval === 'true' ? (
                <>
                  <i className="fa-solid fa-circle-check m-2" style={{ color: '#4CAF50' }}></i>
                  Approved
                </>
              ) : approval === 'false' ? (
                <>
                  <i className="fa-solid fa-circle-xmark m-2" style={{ color: 'red' }}></i>
                  Rejected
                </>
              ) : (
                <>
                  <i className="fa-regular fa-clock m-2" style={{ color: '#FFA500' }}></i>
                  Pending Review
                </>
              )}</div>)}
              {progress !== 'submitted' && <span>Current status: <b>Waiting for Submission</b></span>}
          </small>
        </div>
        <div className="row g-4">
          {fields.map((field, idx) => {

            // Handle section breaks
            if (field.field_id === 0) {
              const sectionCount = fields.slice(0, idx).filter(f => f.field_id === 0).length;
              const sectionLetter = String.fromCharCode(65 + sectionCount);
              
              return (
                <div key={`section-${idx}`} className="col-12 section-break">
                  <div className="section-line"></div>
                  <div className="section-header">
                    <span className="section-title">Section {sectionLetter}</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={field.field_id} className={`${field.type === 'instruction' ? 'full-width-instruction' : 'col-md-4'}`}>

                {field.type === 'instruction' &&(
                  
                    <div className='text-center'>
                      <div>
                        <label className="form-label">
                          <i>{field.value}</i>
                        </label>
                      </div>
                    </div>
                )}  

                {/* Other Field Types */}
                {field.field_id !== 0 && field.type !== 'instruction' && (
                  <div className="form-display-block small text-muted">
                    <div className="form-label" style={{color: 'blue'}}>
                      {field.label}{field.required && <span className="required-star">*</span>}:&nbsp;

                      {/* Text / Email / Number / Phone / Select / Date / Radio */}
                      {['text', 'email', 'number', 'phone', 'date', 'select', 'radio'].includes(field.type) && (
                        <span className="text-dark fw-normal">
                          {formData[field.field_id] || <i className="text-muted">Not filled</i>}
                        </span>
                      )}

                      {/* Textarea */}
                      {field.type === 'textarea' && (
                        <span className="text-dark fw-normal">
                          {(formData[field.field_id] || '').split('\n').map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </span>
                      )}

                      {/* Checkbox */}
                      {field.type === 'checkbox' && (
                        <ul className="mb-0 ps-3">
                          {(formData[field.field_id] || []).map((option, i) => (
                            <li key={i}>{option}</li>
                          ))}
                          {(formData[field.field_id] || []).length === 0 && (
                            <li><i className="text-muted">None selected</i></li>
                          )}
                        </ul>
                      )}
                      {/* Attachment */}
                      {field.type === 'attachment' && formData[field.field_id] && typeof formData[field.field_id] === 'object' && (
                        <div className="attachment-container mt-3">
                          <small className="d-block text-muted mb-2">
                            Uploaded: <strong>{formData[field.field_id].originalname}</strong>
                          </small>

                          {/*
                            1) IMAGE case: preview + vertically centered buttons
                            */}
                          {formData[field.field_id].mimetype?.startsWith('image/') ? (
                            <div className="d-flex align-items-center mb-3">
                              <img
                                src={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${respId}/${field.field_id}/${formData[field.field_id].filename}`}
                                alt="Attachment preview"
                                className="img-thumbnail"
                                style={{ maxHeight: '120px', marginRight: '1rem' }}
                              />
                              <div className="btn-group-vertical">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary mb-1"
                                  onClick={() => handleOpenPDF(formData[field.field_id].filename, field.field_id)}
                                >
                                  View
                                </button>
                                <a
                                  href={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${respId}/${field.field_id}/${formData[field.field_id].filename}`}
                                  download={formData[field.field_id].originalname}
                                  type={formData[field.field_id].mimetype}
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  Download
                                </a>
                              </div>
                            </div>

                          ) : (
                            /* 
                              2) NON-IMAGE case: buttons sit horizontally below the filename 
                            */
                            <div className="mb-1">
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleOpenPDF(formData[field.field_id].filename, field.field_id)}
                                >
                                  View
                                </button>
                                <a
                                  href={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${respId}/${field.field_id}/${formData[field.field_id].filename}`}
                                  download={formData[field.field_id].originalname}
                                  type={formData[field.field_id].mimetype}
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          )}

                          {/* PDF / Image Search (inline in same container) */}
                          {(formData[field.field_id].mimetype === 'application/pdf' ||
                            formData[field.field_id].mimetype.startsWith('image/')) && (
                            <div className="pdf-search-section">
                              <label className="form-label">Find in this file:</label>
                              <div className="input-group">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Search…"
                                  value={searchText}
                                  onChange={e => setSearchText(e.target.value)}
                                />
                                <button
                                  className="btn btn-primary"
                                  onClick={() =>
                                    handlePdfSearch(
                                      `/uploads/system-${systemId}/form-${formId}/${formData[field.field_id].filename}`,
                                      searchText
                                    )
                                  }
                                  disabled={!searchText || isSearching}
                                >
                                  {isSearching ? (
                                    <>
                                      <span
                                        className="spinner-border spinner-border-sm me-1"
                                        role="status"
                                        aria-hidden="true"
                                      ></span>
                                      Searching…
                                    </>
                                  ) : (
                                    <i className="fas fa-search me-1"></i>
                                  )}
                                </button>
                              </div>

                              {searchResults && (
                                <div className="search-results">
                                  {isSearching ? (
                                    <div className="text-center py-3 text-muted">
                                      <div
                                        className="spinner-border text-primary mb-2"
                                        role="status"
                                      ></div>
                                      Searching…
                                    </div>
                                  ) : searchResults.matches.length > 0 ? (
                                    <ul className="list-group">
                                      {searchResults.matches.map((m, i) => (
                                        <li key={i} className="list-group-item">
                                          <div className="d-flex justify-content-between">
                                            <small>Page {m.page}</small>
                                            <small className="text-muted">Pos: {m.position}</small>
                                          </div>
                                          <p className="mb-0">
                                            …{m.context.slice(0, 50)}
                                            <mark>{m.match}</mark>
                                            {m.context.slice(50)}…
                                          </p>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="text-center py-2 text-muted">
                                      <i className="fas fa-file-search me-1"></i>No matches
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            );
          })}


          {/* Supervisor Comment */}
          {(progress === 'submitted' || approval!=='') && (
            <div className="col-md-12 mt-3">
              <div className="form-component">
                <label className="form-label">Approver Comment</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={approval === 'true'} // Disable if approval decision exists
                />
              </div>
            </div>
          )}
        </div>

        {/* Approve / Disapprove buttons or status message */}
        <div className="text-center mt-3">
        {progress === 'submitted' ? (
            approval === 'true' ? (
                <p className="text-muted">
                <i className="fa-solid fa-check me-2"  style={{ color: '#4CAF50', fontSize: '20px'}}></i>
                <strong> Request Approved</strong>
                {/* ✅ */}
                {/* {comment && (
                    <>
                    <br />
                    <strong>Comment:</strong> {comment}
                    </>
                )} */}
                </p>
            ) : (
                <>
                {/* If disapproved or not yet decided, show buttons */}
                {approval === 'false' && (
                  <div>
                    <p className="text-muted mb-0">
                    <i className="fa-solid fa-xmark me-2"  style={{ color: 'red', fontSize: '20px'}}></i>
                     Request has been <strong> Rejected</strong> previously.
                     {/* ❌ */}
                    </p>
                    <br/>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => allowResubmission('in_progress')}
                    >
                        <i className="fa-solid fa-rotate-right me-2" style={{color: 'white'}}></i>
                        Allow Resubmission
                    </button>
                  </div>
                )}

                <button
                    type="button"
                    className="btn btn-danger mx-1 mt-2"
                    onClick={() => handleApproval(false)}
                >
                  <i className="fa-solid fa-xmark me-2"></i>
                    Reject
                </button>
                <button
                    type="button"
                    className="btn btn-success mx-1 mt-2"
                    onClick={() => handleApproval(true)}
                >
                   <i className="fa-solid fa-check me-2"></i>
                    Approve
                </button>
                </>
            )
            ) : (
            <p className="text-muted">
                Request not submitted by the user yet.
                {approval === 'false' && (
                  <div>
                    <p className="text-muted mb-1">
                    <i className="fa-solid fa-repeat me-2" style={{color: 'blue'}}></i>
                    Request has been <strong> Rejected</strong> previously and allowed for  <strong>  resubmission</strong>.
                    {/*  🔄 */}
                    </p>
                  </div>)}
                <br />
                <strong>Current status:</strong> {progress.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </p>
            )}
        </div>
      </div>
      <Dialog open={openPDF} onClose={handleClosePDF} maxWidth="md" fullWidth>
        <div style={{ height: '100vh' }}>
          <iframe
            src={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${respId}/${pdfFieldId}/${pdfFileName}`}
            // {`/api/uploads/system-${systemId}/form-${formId}/${pdfFileName}`} //For non-encrypted SHOULD NOT USE
            // src={`/api/form-response/file/${systemId}/${formId}/${pdfFileName}`} //This works too
            // src={`${API_URL}/uploads/system-${systemId}/form-${formId}/${pdfFileName}`} //This works only on local
            // src="/FVS_FVSCM_SPAN_User_Registration_Form.pdf"
            title="Instruction Document"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </div>
      </Dialog>
      <Dialog open={openInfo} onClose={handleCloseInfo} maxWidth="md" fullWidth>
        <div style={{ height: '100vh' }}>
          <iframe
            src={`${VITE_API_URL}/api/${formDetails.file}`}
            // src={`${API_URL}/${formDetails.file}`}
            // src="/FVS_FVSCM_SPAN_User_Registration_Form.pdf"
            title="Instruction Document"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </div>
      </Dialog>
    </div>
    </>
  );
};

export default FormApproval;

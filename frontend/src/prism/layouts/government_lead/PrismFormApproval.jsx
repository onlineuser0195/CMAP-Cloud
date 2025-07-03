import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import { formAPI, formResponseAPI, systemAPI, pdfAPI } from '../../../api/api';
import '../../../styles/layouts/supervisor/FormApproval.css';
import {API_URL, FVS_FIELD_MAPPING, TRIMMED_ID, USER_ROLES, PRISM_FIELD_MAPPING, PRISM_PLANNED_FIELDS, PRISM_ACTUAL_FIELDS } from '../../../constants/constants';
import useAuth from '../../../hooks/AuthContext';
import { Box } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { logEvent } from '../../../services/logger';
import BackButton from '../../../components/buttons/BackButton';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const PrismFormApproval = () => {
  const { respId, formId, systemId } = useParams();
  const { userRole, mappedRole, userId, firstName, lastName, email } = useAuth();
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
  const [newComment, setNewComment] = useState('');
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
      const timestamp = new Date();
      const formattedTimestamp = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')} ` +
                                `${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}:${String(timestamp.getSeconds()).padStart(2, '0')}`;

      const fullName = `${firstName || ''} ${lastName || ''}`;
      const userEmail = email || '';

      let updatedComment = comment || '';
      if (newComment.trim()) {
        const newEntry = `${formattedTimestamp} - ${fullName} (${userEmail}): ${newComment.trim()}`;
        updatedComment = updatedComment ? `${updatedComment}\n${newEntry}` : newEntry;
      }
      await formResponseAPI.updateFormApproval(
        respId,
        formId,
        systemId,
        decision,
        updatedComment,
        userId
      );
      setNewComment('');
      setComment(updatedComment); 
      logEvent(userId, 'Project Approval', { decision, systemId, formId, respId });
      // Update state to reflect the approval decision
      setApproval(decision ? 'true' : 'false');
      toast.success(`Project saved!`);
    } catch (error) {
      console.error('Error approving form:', error);
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
      toast.success(`Project Update Allowed!`);
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
    if (progress === 'not_started' || progress === 'in_progress') {
      currentStageIndex = 1; // Submitted stage
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

  const sections = [];
  let currentSection = [];

  fields.forEach(field => {
    if (field.field_id === 0) {
      if (currentSection.length) sections.push(currentSection);
      currentSection = [field];
    } else {
      currentSection.push(field);
    }
  });
  if (currentSection.length) sections.push(currentSection);


  if (isLoading)
    return <div className="text-center mt-5">Loading form...</div>;

  return (
    <div className='mt-2 ml-4'>
    <BackButton label='Dashboard' />
    <div className="form-canvas mx-4 d-flex justify-content-center">
      <div>
        <div className="text-center mb-3 pt-0">
          { formId !== '0' && mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole !== USER_ROLES.LOCAL_ADMIN && formDetails.file && <Tooltip placement="top-end" title="View Instruction Document">
              <div style={{ position: 'relative' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" onClick={handleOpenInfo} width="16" height="16" fill="currentColor" className="info-icon bi bi-info-circle-fill" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
                  </svg>
              </div>
          </Tooltip>}
          <h2 className="fw-semibold mb-1 mt-0">{formDetails.name}</h2>
          {/* <span className="fw-semibold mb-1">{formDetails.description}</span><br/> */}
          <small className="text-muted">
            {/* System: <strong>{formDetails.systemName}</strong> <br/> */}
            {visitorId!=='' && <> Visitor Req. ID: <strong> {visitorId.slice(-TRIMMED_ID)} </strong> </>}
            {/* {formData[FVS_FIELD_MAPPING.fname] && <> | Name: <strong>{formData[FVS_FIELD_MAPPING.fname]} {formData[FVS_FIELD_MAPPING.mi]} {formData[FVS_FIELD_MAPPING.lname]}</strong></>} */}
          </small>
        </div>
        <div className="row gx-4 gy-2">
          {(() => {
            // 1️⃣ group into raw “sections” on every field_id===0
            const sections = [];
            let curr = [];
            fields.forEach(f => {
              if (f.field_id === 0) {
                if (curr.length) sections.push(curr);
                curr = [f];
              } else {
                curr.push(f);
              }
            });
            if (curr.length) sections.push(curr);

            // 2️⃣ render each group
            return sections.flatMap((section, sIdx) => {
              const out = [];

              // if the first item is a section-break, render its header
              let children = section;
              if (section[0].field_id === 0) {
                const sec = section[0];
                const secCount = fields
                  .slice(0, fields.indexOf(sec))
                  .filter(x => x.field_id === 0).length;
                const letter = String.fromCharCode(65 + secCount);
                out.push(
                  <div key={`sec-${sIdx}`} className="col-12 section-break">
                    <div className="section-line" />
                    <div className="section-header">
                      <span className="section-title">Section {letter}</span>
                    </div>
                  </div>
                );
                // drop the sentinel from children
                children = section.slice(1);
              }

              // 3️⃣ now within this section, split on instructions
              const groups = [];
              let grp = { instr: null, items: [] };
              children.forEach(f => {
                if (f.type === 'instruction') {
                  groups.push(grp);
                  grp = { instr: f, items: [] };
                } else {
                  grp.items.push(f);
                }
              });
              groups.push(grp);

              // 4️⃣ render each instr+items group
              groups.forEach(({ instr, items }, gIdx) => {
                // instruction header (if any)
                if (instr) {
                  out.push(
                    <div key={`instr-${sIdx}-${gIdx}`} className={`col-12 text-center full-width-instruction  ${!instr.value ? 'd-none' : ''}`}>
                      <label className="form-label">{instr.value}</label>
                    </div>
                  );
                }

                // pick cols for the items

                items.forEach(f => {
                  const val = formData[f.field_id];
                  const globalIndex = fields.findIndex(x => x.field_id === f.field_id);
                  const colClass =
                    items.length === 1 ? 'col-12'
                    : items.length === 2 ? 'col-md-6'
                    : globalIndex >= 33 && globalIndex <= 47 ? 'col-md-4'
                    : 'col-md-3';

                  const renderVal = () => {
                    if (f.field_id === PRISM_FIELD_MAPPING.governmentLead) {
                      return val?.name ? `${val.name} (${val.email})` : <i className="text-muted">Not filled</i>;
                    }
                    if ( f.field_id != PRISM_FIELD_MAPPING.governmentLead && ['text','email','number','phone','date','select','radio'].includes(f.type))
                      return val || <i className="text-muted">Not filled</i>;
                    if (f.type === 'textarea')
                      return (val ? val.split('\n').map((l, i) => <div key={i}>{l}</div>) : <i className="text-muted">Not Filled</i>);
                    if (f.type === 'checkbox') {
                      const arr = val||[];
                      return arr.length
                        ? arr.map((o,i)=><div key={i}>• {o}</div>)
                        : <i className="text-muted">None selected</i>;
                    }
                    if (f.type === 'attachment') {
                      if (val && typeof val === 'object') {
                        return (
                          <>
                            <small className="d-block text-muted mb-1">
                              Uploaded: <strong>{val.originalname}</strong>
                            </small>
                            {/* You can add image preview / download links here */}
                          </>
                        );
                      } else {
                        return <i className="text-muted">No files uploaded</i>;
                      }
                    }
                    return null;
                  };

                  const content = (
                    <div className="form-display-block custom-form-label-box small text-muted"
                        style={{
                          backgroundColor: Object.values(PRISM_PLANNED_FIELDS).includes(f.field_id)
                            ? '#fff8dc' :  // Light yellow
                            Object.values(PRISM_ACTUAL_FIELDS).includes(f.field_id)
                            ? '#d4edda' :  // Light green
                            'white'
                        }}
                    >
                      <label className="fw-bold d-block form-label-app" 
                        style={{
                            color: Object.values(PRISM_PLANNED_FIELDS).includes(f.field_id)
                              ? '#800000' :  // Maroon
                              Object.values(PRISM_ACTUAL_FIELDS).includes(f.field_id)
                              ? '#4c07d6' :  // Dark blue
                              'teal'
                        }}
                      >
                        {f.label}{f.required && ' *'}:
                      </label>
                      <div className="text-dark">{renderVal()}</div>
                    </div>
                  );

                  // const content = (
                  //   <div className="form-display-block small text-muted">
                  //     <div className="d-inline-flex align-items-center">
                  //       <span className="fw-bold me-1">
                  //         {f.label}{f.required && ' *'}:
                  //       </span>
                  //       <span className="text-dark">
                  //         {renderVal()}
                  //       </span>
                  //     </div>
                  //   </div>
                  // );


                  // center single/half
                  if (colClass === 'col-12') {
                    out.push(
                      <div key={f.field_id} className="col-12 d-flex justify-content-center">
                        <div className="w-100 text-center" style={{ maxWidth: 600 }}>
                          {content}
                        </div>
                      </div>
                    );
                  } else if (colClass === 'col-md-6') {
                    out.push(
                      <div key={f.field_id} className="col-md-6 d-flex justify-content-center">
                        <div className="w-100 text-center">{content}</div>
                      </div>
                    );
                  } else if (colClass === 'col-md-3'){
                    out.push(
                      <div key={f.field_id} className="col-md-3">{content}</div>
                    );
                  } 
                  else {
                    out.push(
                      <div key={f.field_id} className="col-md-4">{content}</div>
                    );
                  }
                });
              });

              return out;
            });
          })()}

        {/* Supervisor Comment */}
        {(progress === 'submitted' || approval !== '') && (
          <div className="col-md-12 mt-3">
            <div className="form-component">
              <label className="form-label" style={{color: "blue"}}>Government Lead Comment</label>

              {/* Unified Comment Display + Input Box */}
              <div
                className="form-control"
                style={{
                  minHeight: '180px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '0.75rem'
                }}
              >
                {/* 🕘 Previous Comment History */}
                <div
                  style={{
                    flex: '1 1 auto',
                    overflowY: 'auto',
                    whiteSpace: 'pre-line',
                    fontSize: '0.9rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  {comment?.trim()
                    ? comment.split('\n').map((line, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>
                          {line}
                        </div>
                      ))
                    : <i className="text-muted">No comments yet.</i>}
                </div>

                {approval !== 'true' && (
                  <textarea
                    className="form-control mt-2"
                    placeholder="Type your comment here..."
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        </div>

        {/* Approve / Disapprove buttons or status message */}
        <div className="text-center mt-">
        {progress === 'submitted' || progress === 'in_progress' ? (
            approval === 'true' ? (
                <p className="text-muted">
                <i className="fa-solid fa-check me-2"  style={{ color: '#4CAF50', fontSize: '20px'}}></i>
                <strong> Project Reviewed</strong>
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
                  <div className='mt-3'>
                    {/* <p className="text-muted mb-1">
                    <i className="fa-solid fa-xmark me-2"  style={{ color: 'red', fontSize: '20px'}}></i>
                     Form has been <strong> Rejected</strong> previously.
                    </p> */}
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => allowResubmission('in_progress')}
                    >
                        <i className="fa-solid fa-rotate-right me-2" style={{color: 'white'}}></i>
                        Ask to Update Project
                    </button>
                    <br/>
                  </div>
                )}

                {/* <button
                    type="button"
                    className="btn btn-danger me-3"
                    onClick={() => handleApproval(false)}
                >
                  <i className="fa-solid fa-xmark me-2"></i>
                    Save
                </button> */}
                <button
                    type="button"
                    className="btn btn-success mt-1"
                    onClick={() => handleApproval(false)}
                >
                   <i className="fa-solid fa-check me-2"></i>
                    Save
                </button>
                </>
            )
            ) : (
            <p className="text-muted">
                Project not initiated by the Project Manager yet.
                {/* {approval === 'false' && (
                  <div>
                    <p className="text-muted mb-1">
                    <i className="fa-solid fa-repeat me-2" style={{color: 'blue'}}></i>
                    Project has been <strong> Rejected</strong> previously and allowed for  <strong>  resubmission</strong>.
                    </p>
                  </div>)} */}
                <br />
                <strong>Current Project Status:</strong> {progress.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
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
    </div>
  );
};

export default PrismFormApproval;

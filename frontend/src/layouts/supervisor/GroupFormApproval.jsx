import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { formAPI, formResponseAPI, systemAPI, pdfAPI } from '../../api/api';
import '../../styles/layouts/user/FillForm.css';
import Dialog from '@mui/material/Dialog';
import { API_URL, FVS_FIELD_MAPPING, TRIMMED_ID, USER_ROLES } from '../../constants/constants';
import useAuth from '../../hooks/AuthContext';
import { Box } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import ApproverStepper from '../../components/stepper/ApproverStepper';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { logEvent } from '../../services/logger';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const GroupFormApproval = () => {
  const { formId, systemId, groupId } = useParams();
  const { userRole, mappedRole, userId } = useAuth();   

  // form structure and system info
  const [fields, setFields] = useState([]);
  const [formDetails, setFormDetails] = useState({
    name: '',
    description: '',
    systemName: '',
    file: null
  });
  const [openInfo, setOpenInfo] = useState(false);
  const handleOpenInfo = () => setOpenInfo(true);
  const handleCloseInfo = () => setOpenInfo(false);
  // all responses in this group and navigation index
  const [groupResponses, setGroupResponses] = useState([]);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const currentResponse = useMemo(
    () => groupResponses[currentResponseIndex],
    [groupResponses, currentResponseIndex]
  );
  const isLastResponse = useMemo(
    () => currentResponseIndex === groupResponses.length - 1,
    [currentResponseIndex, groupResponses.length]
  );

  // per-response loaded data cache
  const [allResponses, setAllResponses] = useState({});

  // state for the currently displayed response
  const [formData, setFormData] = useState({});
  const [progress, setProgress] = useState('not_started');
  const [comment, setComment] = useState('');
  const [approval, setApproval] = useState(''); // null = no decision yet; true/false thereafter
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  // loading / error flags
  const [isLoading, setIsLoading] = useState(true);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [error, setError] = useState(null);

  const [openPDFFile, setOpenPDFFile] = useState(null); // null means no dialog open
  const [pdfFieldId, setPdfFieldId] = useState(null);

  const handleOpenPDF = (filename, fieldid) => {
    setOpenPDFFile(filename);
    setPdfFieldId(fieldid);
  };
  
  const handleClosePDF = () => {
    setOpenPDFFile(null);
    setPdfFieldId(null);
  };
  



  // 1) Fetch form schema, system name, and list of response IDs
  useEffect(() => {
    let isMounted = true;
    const fetchGroup = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [formRes, responses, systemRes] = await Promise.all([
          formAPI.getBuildForm(formId),
          formResponseAPI.getFormResponses(formId, systemId, groupId),
          systemAPI.getSystemDetails(systemId),
        ]);

        if (!isMounted) return;

        // sort so navigation order is stable
        const sorted = [...responses].sort((a, b) =>
          a._id.localeCompare(b._id)
        );
        setGroupResponses(sorted);

        setFields(formRes.data.fields);
        setFormDetails({
          name: formRes.data.name,
          description: formRes.data.description,
          systemName: systemRes.data.name,
          file: formRes.data.info?.file_path || null
        });

        if (sorted.length > 0) {
          // Preload ALL responses into cache
          await Promise.all(
            sorted.map(response => 
              loadResponseData(response._id, formRes.data.fields)
            )
          );
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError(err.message || 'Failed to load forms.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchGroup();
    return () => {
      isMounted = false;
    };
  }, [formId, systemId, groupId]);

  // 2) Load a single response’s fields, comment, approval & progress
  const loadResponseData = useCallback(
    async (responseId, formFields) => {
      setIsResponseLoading(true);
      setError(null);
      try {
        const responseRes = await formResponseAPI.getFormResponse(
          responseId,
          formId,
          systemId,
          userId
        );

        // build formData object keyed by field_id
        const initialData = {};
        formFields.forEach((field) => {
          let raw = responseRes.fields?.[String(field.field_id)];
          let value =
            raw != null
              ? raw
              : field.type === 'checkbox'
              ? []
              : field.type === 'attachment'
              ? null
              : '';
          initialData[field.field_id] = value;
        });

        // track in cache
        setAllResponses((prev) => ({
          ...prev,
          [responseId]: {
            data: initialData,
            progress: responseRes.progress,
            comment: responseRes.comment || '',
            approval:
              responseRes.approved === 'true'
              ? 'true'
              : responseRes.approved === 'false'
                  ? 'false'
                  : ''
          },
        }));

        // populate local state
        setFormData(initialData);
        setProgress(responseRes.progress);
        setComment(responseRes.comment || '');
        setApproval(
            responseRes.approved === 'true'
                ? 'true'
                : responseRes.approved === 'false'
                    ? 'false'
                    : ''
        );
      } catch (err) {
        console.error('Error loading response:', err);
        setError('Failed to load response data');
      } finally {
        setIsResponseLoading(false);
      }
    },
    [formId, systemId]
  );

  // 3) Navigate between responses
// ❶ Cache the “current” in-progress state before switching tabs:
const handleResponseChange = useCallback((newIndex) => {
    if (!currentResponse) return;
  
    setAllResponses(prev => ({
      ...prev,
      [currentResponse._id]: {
        data: formData,
        progress,
        comment,
        approval,
      }
    }));
  
    setCurrentResponseIndex(newIndex);
  }, [currentResponse, formData, progress, comment, approval]);
  
  // ❷ A single effect that fires whenever the index changes:
  useEffect(() => {
    if (!groupResponses.length) return;
  
    const resp = groupResponses[currentResponseIndex];
    const cached = allResponses[resp._id];
  
    if (cached) {
      // Restore from cache
      setFormData(cached.data);
      setProgress(cached.progress);
      setComment(cached.comment);
      setApproval(cached.approval);
    } else {
      // Fetch fresh
      loadResponseData(resp._id, fields);
    }
  }, [currentResponseIndex, groupResponses, allResponses, fields, loadResponseData]);

  
  const handlePrev = () => handleResponseChange(currentResponseIndex - 1);
  const handleNext = () => handleResponseChange(currentResponseIndex + 1);

  // 4) Comment editing
  const handleCommentChange = (e) => {
    const v = e.target.value;
    setComment(v);
    const currId = currentResponse?._id;
    if (currId)
      setAllResponses((prev) => ({
        ...prev,
        [currId]: {
          ...prev[currId],
          comment: v,
        },
      }));
  };


  const getStatusBorderClass = (response) => {
    if (response.approved === 'true')  return 'tab-border-success';
    if (response.approved === 'false') return 'tab-border-danger';
  
    switch (response.progress) {
      case 'in_progress': return 'tab-border-warning';
      case 'submitted':   return 'tab-border-primary';
      default:            return '';
    }
  };

  const allowResubmissionAll = async () => {
    try {
      const resubmissions = groupResponses.map(async (response) => {
        const { progress, approved } = response;
  
        if (progress === 'submitted') {
          await formResponseAPI.updateFormProgress(
            response._id,
            formId,
            systemId,
            'in_progress',
            userId
          );
  
          // update UI state for groupResponses
          setGroupResponses(prev =>
            prev.map(r =>
              r._id === response._id
                ? { ...r, progress: 'in_progress' }
                : r
            )
          );
  
          // FIX: update allResponses properly
          setAllResponses(prev => ({
            ...prev,
            [response._id]: {
              ...prev[response._id],
              progress: 'in_progress'
            }
          }));
        }
      });
  
      await Promise.all(resubmissions);
      toast.success('✅ Resubmission allowed for all rejected submitted forms!');
    } catch (error) {
      console.error('Error allowing resubmission for group:', error);
      toast.error('❌ Failed to allow resubmission for all forms.');
    }
  };
  
  // 5) Approve / Disapprove
  const handleApproval = async (decision) => {
    try {
      await formResponseAPI.updateFormApproval(
        currentResponse._id,
        formId,
        systemId,
        decision,
        comment,
        userId
      );
      // map boolean → string
      setApproval(decision ? 'true' : 'false');
      setAllResponses(prev => ({
        ...prev,
        [currentResponse._id]: {
          ...prev[currentResponse._id],
          approval: decision ? 'true' : 'false',
        }
      }));
      toast.success(`Request ${decision ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error approving form:', error);
      toast.error(error.message);
    }
  };

  const handleApproveAll = async () => {
    try {
      // Create a temporary copy of all responses including current state
      const updatedAllResponses = { ...allResponses };
      if (currentResponse) {
        updatedAllResponses[currentResponse._id] = {
          data: formData,
          progress,
          comment,
          approval,
        };
      }
  
      const approvals = groupResponses.map(async (response) => {
        const { progress, approved } = response;
  
        if (progress === 'submitted' ) {
          const commentText = updatedAllResponses[response._id]?.comment || '';
  
          await formResponseAPI.updateFormApproval(
            response._id,
            formId,
            systemId,
            true,
            commentText,
            userId
          );
  
          // Update local cache
          setAllResponses((prev) => ({
            ...prev,
            [response._id]: {
              ...prev[response._id],
              approval: 'true',
              comment: commentText
            },
          }));
        }
      });
      logEvent(userId, 'Group Request Approval', { approval: 'true', systemId, formId, currentResponse });
      await Promise.all(approvals);
      toast.success('All submitted forms have been approved!');
    } catch (err) {
      console.error('Error in batch approval:', err);
      toast.error('Failed to approve all submitted forms.');
    }
  };
  
  const handleRejectAll = async () => {
    try {
      // Create a temporary copy of all responses including current state
      const updatedAllResponses = { ...allResponses };
      if (currentResponse) {
        updatedAllResponses[currentResponse._id] = {
          data: formData,
          progress,
          comment,
          approval,
        };
      }
  
      const rejections = groupResponses.map(async (response) => {
        const { progress, approved } = response;
  
        if (progress === 'submitted') {
          const commentText = updatedAllResponses[response._id]?.comment || '';
  
          await formResponseAPI.updateFormApproval(
            response._id,
            formId,
            systemId,
            false,
            commentText,
            userId
          );
  
          // Update local cache
          setAllResponses((prev) => ({
            ...prev,
            [response._id]: {
              ...prev[response._id],
              approval: 'false',
              comment: commentText
            },
          }));
        }
      });
      logEvent(userId, 'Group Request Approval', { approval: 'false', systemId, formId, currentResponse });
      await Promise.all(rejections);
      toast.success('All submitted forms have been rejected!');
    } catch (err) {
      console.error('Error in batch rejection:', err);
      toast.error('Failed to reject all submitted forms.');
    }
  };  

  const handlePdfSearch = async (filepath, searchText) => {
    try {
      setIsSearching(true);
      setSearchResults(null);
      const results = await pdfAPI.searchPDF(
        filepath, // Remove base URL if needed .replace(API_URL, '')
        searchText,
        'scanned',
        systemId
      );
      setSearchResults(results);
    } catch (error) {
      toast.error('Search failed: ' + error.message);
      setSearchResults({ matches: [] }); // Set empty results on error
    } finally {
      setIsSearching(false);
    }
  };

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


  // --- render states ---
  if (isLoading)
    return <div className="text-center mt-5">Loading forms...</div>;
  if (error)
    return <div className="alert alert-danger text-center">{error}</div>;
  if (groupResponses.length === 0)
    return (
      <div className="alert alert-info text-center">
        No responses found in this group
      </div>
    );

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
    <div className="form-canvas pt-4 p-3 d-flex justify-content-center">
      <div>
        {/* header */}
        <div className="text-center mb-1 pt-5 mt-5">
          { formId !== '0' && mappedRole !== USER_ROLES.GLOBAL_ADMIN  && mappedRole !== USER_ROLES.LOCAL_ADMIN && formDetails.file && <Tooltip placement="top-end" title="View Instruction Document">
              <div style={{ position: 'relative' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" onClick={handleOpenInfo} width="16" height="16" fill="currentColor" className="info-icon bi bi-info-circle-fill" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
                  </svg>
              </div>
          </Tooltip>}
          {/* <h2 className="fw-semibold mb-1">{formDetails.name}</h2> */}
          {/* <span className="fw-semibold mb-1">{formDetails.description}</span><br/> */}
          <small className="text-muted">
            {/* System: <strong>{formDetails.systemName}</strong> <br/>  */}
            {/* Group ID: <strong>{groupId}</strong> |  */}
            {groupResponses[currentResponseIndex].display_id!=='' && <> Visitor(s) Req. ID: <strong> {groupResponses[currentResponseIndex].display_id?.slice(-TRIMMED_ID)} </strong> | </>}
            Visitor: <strong>{currentResponseIndex + 1} of {groupResponses.length}</strong> <br/>
            {/* Response ID: <strong> {groupResponses[currentResponseIndex]._id} </strong> */}
            {groupResponses[currentResponseIndex].fields[FVS_FIELD_MAPPING.fname] && <> Name: <strong>{groupResponses[currentResponseIndex].fields[FVS_FIELD_MAPPING.fname]} {groupResponses[currentResponseIndex].fields[FVS_FIELD_MAPPING.mi]} {groupResponses[currentResponseIndex].fields[FVS_FIELD_MAPPING.lname]}</strong> </>}
          </small>
        </div>

        {/* nav tabs */}
        <div className="d-flex justify-content-center mb-4">
          <ul className="nav nav-tabs">
            {groupResponses.map((r, i) => {
              const isActive = i === currentResponseIndex;
              const statusClass = getStatusBorderClass(r);
              return (
              <li key={r._id} className="nav-item">
                <button
                  className={
                    `nav-tab ` +
                    statusClass +
                    (isActive ? ' active-tab' : '')
                  }
                  onClick={() => handleResponseChange(i)}
                  disabled={isResponseLoading}
                >
                  Visitor {i + 1}
                </button>
              </li>
              );
            })}
          </ul>
        </div>

        {/* body */}
        {isResponseLoading ? (
          <div className="text-center my-4">Loading response data...</div>
        ) : (
          <>
            <div>
              <div className="row g-4">
{fields.map((field, idx) => {
  // Handle section breaks
  if (field.field_id === 0) {
    const sectionCount = fields.slice(0, idx).filter(f => f.field_id === 0).length;
    const sectionLetter = String.fromCharCode(65 + sectionCount);
    return (
      <div key={`section-${idx}`} className="col-12 section-break">
        <div className="section-line" />
        <div className="section-header">
          <span className="section-title">Section {sectionLetter}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      key={field.field_id}
      className={`${field.type === 'instruction' ? 'full-width-instruction' : 'col-md-4'}`}
    >
      {/* Instruction */}
      {field.type === 'instruction' && (
        <div className="text-center">
          <label className="form-label">
            <i>{field.value}</i>
          </label>
        </div>
      )}

      {/* Other Field Types */}
      {field.field_id !== 0 && field.type !== 'instruction' && (
        <div className="form-display-block small text-muted">
          <div className="form-label" style={{ color: 'blue' }}>
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
            {field.type === 'attachment' &&
              formData[field.field_id] &&
              typeof formData[field.field_id] === 'object' && (
                <div className="attachment-container mt-3">
                  <small className="d-block text-muted mb-2">
                    Uploaded: <strong>{formData[field.field_id].originalname}</strong>
                  </small>

                  {formData[field.field_id].mimetype?.startsWith('image/') ? (
                    // 1) IMAGE case: preview + vertically-centered buttons
                    <div className="d-flex align-items-center mb-3">
                      <img
                        src={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${currentResponse._id}/${field.field_id}/${formData[field.field_id].filename}`}
                        alt="Attachment preview"
                        className="img-thumbnail"
                        style={{ maxHeight: '120px', marginRight: '1rem' }}
                      />
                      <div className="btn-group-vertical">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary mb-1"
                          onClick={() =>
                            handleOpenPDF(
                              formData[field.field_id].filename,
                              field.field_id
                            )
                          }
                        >
                          View
                        </button>
                        <a
                          href={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${currentResponse._id}/${field.field_id}/${formData[field.field_id].filename}`}
                          download={formData[field.field_id].originalname}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    // 2) NON-IMAGE case: buttons sit horizontally below the filename
                    <div className="mb-1">
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            handleOpenPDF(
                              formData[field.field_id].filename,
                              field.field_id
                            )
                          }
                        >
                          View
                        </button>
                        <a
                          href={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${currentResponse._id}/${field.field_id}/${formData[field.field_id].filename}`}
                          download={formData[field.field_id].originalname}
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


                {/* supervisor comment */}
                {(progress === 'submitted' || approval!=='') && (
                  <div className="col-md-12 mt-4">
                    <div className="form-component">
                      <label className="form-label">
                        Approver Comment
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={comment}
                        onChange={handleCommentChange}
                        disabled={progress !== 'submitted' || approval==='true'}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* navigation & action buttons */}
            <div className="text-center mt-3">
              <div className="d-flex justify-content-between mb-0">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handlePrev}
                  disabled={currentResponseIndex === 0 || isResponseLoading}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleNext}
                  disabled={isLastResponse || isResponseLoading}
                >
                  Next
                </button>
              </div>

              {progress === 'submitted' ? (
                approval === 'true' ? (
                    // Only when approved, hide buttons entirely
                    <p className="text-muted">
                    <i className="fa-solid fa-check me-2"  style={{ color: '#4CAF50', fontSize: '20px'}}></i>
                    <strong>Request Approved</strong>
                    {/* ✅ */}
                    </p>
                ) : (
                    // For both '' and 'false', show buttons
                    <>
                    {/* Show a disapproval notice if it was already disapproved */}
                    {approval === 'false' && (
                        <div>
                          <p className="text-muted mb-0">
                          <i className="fa-solid fa-xmark me-2"  style={{ color: 'red', fontSize: '20px'}}></i>
                          Request has been <strong>Rejected</strong> previously.
                          {/* ❌ */}
                          </p>
                          <br/>
                          <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => allowResubmissionAll('in_progress')}
                          >
                              <i className="fa-solid fa-rotate-right"  style={{color: 'white'}}></i>
                              Allow Resubmission
                          </button>
                          <br/><br/>
                        </div>
                    )}

                    {/* <button
                        type="button"
                        className="btn btn-outline-danger me-3"
                        onClick={() => handleApproval(false)}
                    >
                        Reject
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-success me-3"
                        onClick={() => handleApproval(true)}
                    >
                        Approve
                    </button> */}
                    <button
                        type="button"
                        className="btn btn-danger mx-1 mt-2"
                        onClick={handleRejectAll}
                    >
                       <i className="fa-solid fa-xmark me-2"></i>
                        Reject All
                    </button>
                    <button
                      type="button"
                      className="btn btn-success mx-1 mt-2"
                      onClick={handleApproveAll}
                    >
                      <i className="fa-solid fa-check me-2"></i>
                      Approve All
                    </button>
                    </>
                )
                ) : (
                // Not submitted yet
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
          </>
        )}
      </div>
      <Dialog open={!!openPDFFile} onClose={handleClosePDF} maxWidth="md" fullWidth>
        <div style={{ height: '100vh' }}>
          <iframe
            src={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${currentResponse._id}/${pdfFieldId}/${openPDFFile}`}
            // src="/FVS_FVSCM_SPAN_User_Registration_Form.pdf"
            title="Instruction Document"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </div>
      </Dialog>
      <Dialog open={!!openInfo} onClose={handleCloseInfo} maxWidth="md" fullWidth>
        <div style={{ height: '100vh' }}>
          <iframe
            src={`${VITE_API_URL}/api/${formDetails.file}`}
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

export default GroupFormApproval;

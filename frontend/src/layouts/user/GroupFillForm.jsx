import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, Box, Typography, Tabs, Tab, Chip, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DangerousIcon from '@mui/icons-material/Dangerous';
import SendIcon from '@mui/icons-material/Send';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { formAPI, formResponseAPI, systemAPI } from '../../api/api';
import useAuth from '../../hooks/AuthContext';
import '../../styles/layouts/user/FillForm.css';
import '../../styles/layouts/user/GroupFillForm.css';
import Dialog from '@mui/material/Dialog';
import { API_URL, FVS_FIELD_MAPPING, TRIMMED_ID, USER_ROLES } from '../../constants/constants';
import Tooltip from '@mui/material/Tooltip';
import EmbassyUserStepper from '../../components/stepper/EmbassyUserStepper';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { logEvent } from '../../services/logger';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const GroupFillForm = () => {
  const { userRole, mappedRole, userId } = useAuth();
  const { formId, systemId, groupId } = useParams();
  const navigate = useNavigate();

  // State management
  const [formData, setFormData] = useState({});
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [progress, setProgress] = useState('not_started');
  const [comment, setComment] = useState('');
  const [approval, setApproval] = useState('');
  const [error, setError] = useState(null);
  const [formDetails, setFormDetails] = useState({
    name: '',
    description: '',
    systemName: '',
    file: null
  });
  const [openInfo, setOpenInfo] = useState(false);
  const handleOpenInfo = () => setOpenInfo(true);
  const handleCloseInfo = () => setOpenInfo(false);
  const [groupResponses, setGroupResponses] = useState([]);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  // Map of responseId → its current formData object
  const [allDrafts, setAllDrafts] = useState({});
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
  

  // Memoized derived values
  const currentResponse = useMemo(() => 
    groupResponses[currentResponseIndex], 
    [groupResponses, currentResponseIndex]
  );

  const isLastResponse = useMemo(() => 
    currentResponseIndex === groupResponses.length - 1,
    [currentResponseIndex, groupResponses.length]
  );

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [formRes, responses, systemRes] = await Promise.all([
          formAPI.getBuildForm(formId),
          formResponseAPI.getFormResponses(formId, systemId, groupId),
          systemAPI.getSystemDetails(systemId)
        ]);

        if (!isMounted) return;

        setFields(formRes.data.fields);

        // Sort responses alphabetically by MongoDB ObjectId
        const sortedResponses = responses.sort((a, b) => {
          return a._id.localeCompare(b._id);
        });

        setGroupResponses(responses);
        setFormDetails({
          name: formRes.data.name,
          description: formRes.data.description,
          systemName: systemRes.data.name,
          file: formRes.data.info?.file_path || null
        });

        if (responses.length > 0) {
          await loadResponseData(responses[0]._id, formRes.data.fields);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error:', error);
          setError(error.message || 'Failed to load form.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [formId, systemId, groupId]);

  useEffect(() => {
    console.log('Group responses updated:', groupResponses);
  }, [groupResponses]);


  useEffect(() => {
    console.log('Request Data updated:', formData);
  }, [formData]);

  // Load response data
  const loadResponseData = useCallback(async (responseId, formFields) => {
    try {
      setIsFormLoading(true);
      const responseRes = await formResponseAPI.getFormResponse(responseId, formId, systemId, userId);
      
      const initialData = {};
      formFields.forEach(field => {
        let value = responseRes.fields?.[String(field.field_id)] ?? 
          (field.type === 'checkbox' ? [] : 
           field.type === 'attachment' ? null : '');
        initialData[field.field_id] = value;
      });

      setFormData(initialData);
      setAllDrafts(prev => ({
        ...prev,
        [responseId]: initialData
      }));
      setIsSubmitted(responseRes.progress === 'submitted');
      setProgress(responseRes.progress);
      setComment(responseRes.comment || '');
      setApproval(responseRes.approved || '');
    } catch (error) {
      console.error('Error loading response:', error);
      setError('Failed to load response data');
    } finally {
      setIsFormLoading(false);
    }
  }, [formId, systemId]);

  
  // Navigation handlers
  const handleResponseChange = useCallback(async (index) => {
    if (index < 0 || index >= groupResponses.length) return;
    
    // 1) persist current tab’s edits
    setAllDrafts(prev => ({
      ...prev,
      [currentResponse._id]: formData
    }));
  
    // 2) switch index
    setCurrentResponseIndex(index);

    const next = groupResponses[index];
    logEvent(userId, 'Group Request Approval', {progress: next.progress, systemId, formId, currentResponse });

    // 3) if we already have drafts for it, restore; otherwise fetch
    if (allDrafts[next._id] && Object.keys(allDrafts[next._id]).length) {
      setFormData(allDrafts[next._id]);
      setIsSubmitted(next.progress === 'submitted');
      setProgress(next.progress);
      setComment(next.comment);
      setApproval(next.approved || '');
    } else {
      await loadResponseData(next._id, fields);
    }
  }, [allDrafts, currentResponse, formData, fields, groupResponses, loadResponseData]);

  const handleNext = useCallback(() => 
    handleResponseChange(currentResponseIndex + 1),
    [currentResponseIndex, handleResponseChange]
  );

  const handlePrev = useCallback(() => 
    handleResponseChange(currentResponseIndex - 1),
    [currentResponseIndex, handleResponseChange]
  );

  // Form field handlers
  const handleInputChange = useCallback((fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleCheckboxChange = useCallback((fieldId, option) => {
    setFormData(prev => {
      const currentValues = prev[fieldId] || [];
      const newValues = currentValues.includes(option)
        ? currentValues.filter(v => v !== option)
        : [...currentValues, option];
      return { ...prev, [fieldId]: newValues };
    });
  }, []);

  // Form validation
  const isFormValid = useMemo(() => {
    return fields.every(field => {
      if (!field.required) return true;
      const value = formData[field.field_id];
      
      return field.type === 'checkbox' ? value?.length > 0 :
             field.type === 'attachment' ? value instanceof File :
             value !== undefined && value !== null && value !== '';
    });
  }, [fields, formData]);

  const areAllFormsValid = useMemo(() => {
    return groupResponses.every((response, idx) => {
      // for the current tab, use formData; otherwise use stored draft
      const data = idx === currentResponseIndex
        ? formData
        : allDrafts[response._id] || {};
  
      return fields.every(field => {
        if (!field.required) return true;
        const value = data[field.field_id];
        return field.type === 'checkbox'
                 ? Array.isArray(value) && value.length > 0
                 : field.type === 'attachment'
                   ? value instanceof File || (!!value && !!value.filename)
                   : value !== undefined && value !== null && value !== '';
      });
    });
  }, [groupResponses, allDrafts, formData, currentResponseIndex, fields]);
  
  
  // Save/submit handlers
  const handleUpdate = useCallback(async (newProgress) => {
    try {
      if (!currentResponse) return;

      const hasAttachment = fields.some(f => f.type === 'attachment');
      const submissionData = hasAttachment ? new FormData() : {};

      Object.entries(formData).forEach(([fieldId, value]) => {
        if (hasAttachment) {
          if (value instanceof File) {
            submissionData.append(fieldId, value);
          } else {
            submissionData.append(fieldId, JSON.stringify(value));
          }
        } else {
          submissionData[fieldId] = value;
        }
      });

      if (hasAttachment) {
        submissionData.append('progress', newProgress);
      }

      await formResponseAPI.updateFormResponse(
        currentResponse._id,
        formId,
        systemId,
        submissionData,
        newProgress,
        userId,
        hasAttachment
      );

      // Update local state
      setGroupResponses(prev => prev.map((r, i) => 
        i === currentResponseIndex ? { ...r, progress: newProgress } : r
      ));

      setAllDrafts(prev => ({
        ...prev,
        [currentResponse._id]: formData
      }));
  
      setIsSubmitted(newProgress === 'submitted');
      setProgress(newProgress);

      toast.success(`Request ${newProgress === 'submitted' ? 'submitted' : 'saved'} successfully!`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Submission failed.');
    }
  }, [currentResponse, formId, systemId, formData, fields, currentResponseIndex]);

  const getStatusBorderClass = (response) => {
    if (response.approved === 'true')  return 'tab-border-success';
    if (response.approved === 'false') return 'tab-border-danger';
  
    switch (response.progress) {
      case 'in_progress': return 'tab-border-warning';
      case 'submitted':   return 'tab-border-primary';
      default:            return '';
    }
  };

  const getStatusChip = (response) => {
    // Approval status takes priority
    if (response.approved === 'true') {
      return <Chip label="Approved" color="success" size="small" icon={<CheckCircleOutlineIcon fontSize="small" />} />;
    }
    if (response.approved === 'false') {
      return <Chip label="Not Approved" color="error" size="small" icon={<DangerousIcon fontSize="small" />} />;
    }
  
    // Progress states
    switch (response.progress) {
      case 'submitted':
        return <Chip label="Submitted" color="primary" size="small" icon={<SendIcon fontSize="small" />} />;
      case 'in_progress':
        return <Chip label="In Progress" color="warning" size="small" icon={<HourglassTopIcon fontSize="small" />} />;
      default:
        return <Chip label="Not Started" color="default" size="small" icon={<RadioButtonUncheckedIcon fontSize="small" />} />;
    }
  };  

  const handleUpdateAll = useCallback(async (newProgress) => {
    try {
      const hasAttachment = fields.some(f => f.type === 'attachment');
  
      // ensure current tab’s edits are in the map
      setAllDrafts(prev => ({
        ...prev,
        [currentResponse._id]: formData
      }));
  
      const updates = groupResponses.map(response => {
        const data = allDrafts[response._id] || {};
        let payload = hasAttachment ? new FormData() : {};
        Object.entries(data).forEach(([fid, val]) => {
          if (hasAttachment) {
            if (val instanceof File) payload.append(fid, val);
            else payload.append(fid, JSON.stringify(val));
          } else payload[fid] = val;
        });
        if (hasAttachment) payload.append('progress', newProgress);
  
        return formResponseAPI.updateFormResponse(
          response._id,
          formId,
          systemId,
          payload,
          newProgress,
          userId,
          hasAttachment
        );
      });
  
      await Promise.all(updates);
  
      // reflect new progress in UI
      setGroupResponses(gr =>
        gr.map(r => ({ ...r, progress: newProgress }))
      );
      setIsSubmitted(newProgress === 'submitted');
      setProgress(newProgress);
  
      toast.success(`All forms ${newProgress === 'submitted' ? 'submitted' : 'saved'}!`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update all forms');
    }
  }, [allDrafts, currentResponse, formData, fields, formId, groupResponses, systemId]);
  
  function getStepperProps(progress, isSubmitted, approved) {
    let currentStageIndex;
    let submissionStatus = '';
    let approvalStatus = '';
  
    // Determine current stage
    if (!isSubmitted && !areAllFormsValid) {
      currentStageIndex = 0;
    } else if (progress === 'not_started' || progress === 'in_progress') {
      currentStageIndex = 1; // Draft stage
    } else if (progress === 'submitted') {
      currentStageIndex = 2; // Submitted stage
      submissionStatus = 'submitted';
      // Handle approval status only after submission
      if (approved === 'true') {
        currentStageIndex = 3; // Approved stage
        approvalStatus = 'approved';
      } else if (approved === 'false') {
        currentStageIndex = 3; // Rejected stage
        approvalStatus = 'rejected';
      }
    }
  
    return { currentStageIndex, submissionStatus, approvalStatus };
  }
  
  // Usage in your component
  const { currentStageIndex, submissionStatus, approvalStatus } = getStepperProps(
    progress,
    isSubmitted,
    approval
  );

  if (isLoading) return <div className="text-center mt-5">Loading form...</div>;
  if (error) return <div className="alert alert-danger text-center">{error}</div>;
  if (groupResponses.length === 0) return <div className="alert alert-info text-center">No responses found in this group</div>;

  return (
    <>
          <Box textAlign="center" mb={3}>
            {mappedRole === USER_ROLES.APP_USER && 
            <EmbassyUserStepper 
              currentStageIndex={currentStageIndex}
              submissionStatus={submissionStatus}
              approvalStatus={approvalStatus}
            />}
        </Box>
    <div className="form-canvas pt-4 p-3 d-flex justify-content-center">
      <div>
        <div className="text-center mb-1 pt-5 mt-5">
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
            {/* System: <strong>{formDetails.systemName}</strong> <br/>  */}
            {/* Group ID: <strong>{groupId}</strong> |  */}
            {groupResponses[currentResponseIndex].display_id!==''  && <>Visitor(s) Req. ID: <strong> {groupResponses[currentResponseIndex].display_id?.slice(-TRIMMED_ID)} </strong> | </>}
            Visitor: <strong>{currentResponseIndex + 1} of {groupResponses.length}</strong> <br/>
            {groupResponses[currentResponseIndex].fields[FVS_FIELD_MAPPING.fname] && <>Name: <strong>{groupResponses[currentResponseIndex].fields[FVS_FIELD_MAPPING.fname]} {groupResponses[currentResponseIndex].fields[FVS_FIELD_MAPPING.mi]} {groupResponses[currentResponseIndex].fields[FVS_FIELD_MAPPING.lname]}</strong></>}
          </small>
        </div>

        {/* Navigation Tabs */}
        <div className="d-flex justify-content-center mb-4">
          <ul className="nav nav-tabs">
            <li className="nav-item text-center m-3 mt-0">
                  <span>
                    Visitors
                  </span>
                  <br />
                  <br />
                  {/* Status Chip */}
                  <span>Status</span>
            </li>
            {groupResponses.map((response, index) => {
               const isActive = index === currentResponseIndex;
               const statusClass = getStatusBorderClass(response);
               return(
                <li key={response._id} className="nav-item text-center">
                  <button
                    // className={`nav-tab ${getTabClass(response, isActive)}`}
                    className={
                      `mt-1 nav-tab ` +
                      statusClass +      // e.g. "tab-border-warning"
                      (isActive ? ' active-tab' : '')
                    }
                    onClick={() => handleResponseChange(index)}
                    disabled={isFormLoading}
                  >
                    Visitor {index + 1}
                  </button>
                  <br />
                  {/* Status Chip */}
                  {getStatusChip(response)}
                </li>
               );
            })}
          </ul>
        </div>

        {isFormLoading ? (
          <div className="text-center my-4">Loading response data...</div>
        ) : (
          <>
            {/* Form Fields */}
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

            return(
              <div key={field.field_id} className={`${field.type === 'instruction' ? 'full-width-instruction' : 'col-md-4'}`}>

                {field.type === 'instruction' &&(
                  
                    <div className='text-center'>
                      <div>
                        <label className="form-label">
                          {field.value}
                        </label>
                      </div>
                    </div>
                )}

                {field.type !== 'instruction' && (
                <div className="form-component">
                  <label className="form-label">
                    {field.label}
                    {field.required && <span className="required-star">*</span>}
                  </label>  

                  {field.type === 'text' && (
                    <input
                      type="text"
                      className="form-control"
                      value={formData[field.field_id] || ''}
                      onChange={(e) => handleInputChange(field.field_id, e.target.value)}
                      required={field.required}
                      placeholder={isSubmitted ? '' : (field.placeholder || '')}
                      disabled={isSubmitted || field.notEditableBy.includes(mappedRole) }
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      className="form-control"
                      rows={field.rows || 4}
                      value={formData[field.field_id] || ''}
                      onChange={(e) => handleInputChange(field.field_id, e.target.value)}
                      required={field.required}
                      placeholder={isSubmitted ? '' : (field.placeholder || '')}
                      disabled={isSubmitted}
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      className="form-select"
                      value={formData[field.field_id] || ''}
                      onChange={(e) => handleInputChange(field.field_id, e.target.value)}
                      required={field.required}
                      disabled={isSubmitted}
                    >
                      <option value="">Select an option</option>
                      {field.options.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'checkbox' && (
                    <div className="checkbox-group">
                      {field.options.map((option, i) => (
                        <div key={i} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={(formData[field.field_id] || []).includes(option)}
                            onChange={() => handleCheckboxChange(field.field_id, option)}
                            disabled={isSubmitted}
                          />
                          <label className="form-check-label">{option}</label>
                        </div>
                      ))}
                    </div>
                  )}

                  {field.type === 'radio' && (
                    <div className="radio-group">
                      {field.options.map((option, i) => (
                        <div key={i} className="form-check">
                          <input
                            type="radio"
                            className="form-check-input"
                            name={`radio-${field.field_id}`}
                            value={option}
                            checked={formData[field.field_id] === option}
                            onChange={(e) => handleInputChange(field.field_id, e.target.value)}
                            disabled={isSubmitted}
                          />
                          <label className="form-check-label">{option}</label>
                        </div>
                      ))}
                    </div>
                  )}

                  {field.type === 'date' && (
                  <div>
                    <input
                      type="date"
                      className="form-control"
                      value={formData[field.field_id] || ''}
                      onChange={(e) => handleInputChange(field.field_id, e.target.value)}
                      required={field.required}
                      min={field.minDate}
                      max={field.maxDate}
                      disabled={isSubmitted}
                    />
                    {/* <i class="fa-solid fa-calendar-days"></i> */}
                    <span style={{
                      position: 'absolute',
                      right: '2rem',
                      top: '55%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none', // Ensures clicks pass through to the input
                    }}>
                      📅
                    </span>
                  </div>
                  )}

                  {field.type === 'email' && (
                    <input
                      type="email"
                      className="form-control"
                      value={formData[field.field_id] || ''}
                      onChange={(e) => handleInputChange(field.field_id, e.target.value)}
                      required={field.required}
                      placeholder={isSubmitted ? '' : (field.placeholder || '')}
                      pattern={field.pattern || ''}
                      disabled={isSubmitted}
                    />
                  )}

                  {field.type === 'phone' && (
                    <input
                      type="tel"
                      className="form-control"
                      value={formData[field.field_id] || ''}
                      onChange={(e) => handleInputChange(field.field_id, e.target.value)}
                      required={field.required}
                      placeholder={isSubmitted ? '' : (field.placeholder || '')}
                      pattern={field.pattern || ''}
                      disabled={isSubmitted}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      className="form-control"
                      value={formData[field.field_id] || ''}
                      onChange={(e) => handleInputChange(field.field_id, e.target.value)}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      disabled={isSubmitted}
                    />
                  )}
                  {field.type === 'attachment' && (
                    <>
                      <input
                        type="file"
                        className="form-control"
                        accept={field.accept}
                        onChange={(e) => handleInputChange(field.field_id, e.target.files[0])}
                        disabled={isSubmitted}
                        title={`Max size: ${field.maxSizeMB || 10}MB`}
                      />

                      {formData[field.field_id] &&
                        typeof formData[field.field_id] === 'object' &&
                        formData[field.field_id].filename && (
                          <div className="mt-2">
                            <small className="d-block text-muted mb-1">
                              Uploaded file:
                              <strong> {formData[field.field_id].originalname}</strong>
                            </small>

                            {/* Preview for image or PDF */}
                            {formData[field.field_id].mimetype?.startsWith('image/') && (
                              <>
                              <img
                                src={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${currentResponse._id}/${field.field_id}/${formData[field.field_id].filename}`}
                                alt="Uploaded preview"
                                className="img-thumbnail"
                              
                              /><br /></>
                            )}
                            {/* Link to view file in a new tab (fallback)  */}
                            {!formData[field.field_id].mimetype?.startsWith('image/') && (
                                  <span onClick={() => handleOpenPDF(formData[field.field_id].filename, field.field_id)}
                                    className="btn btn-sm btn-outline-primary m-1">
                                  View
                                </span>
                            )}
                            {/* Download button */}
                            <a
                              href={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${currentResponse._id}/${field.field_id}/${formData[field.field_id].filename}`}
                              download={formData[field.field_id].originalname} // this has the extension
                              type={formData[field.field_id].mimetype}
                              className="btn btn-sm btn-outline-primary m-1"
                            >
                              Download
                            </a>
                          </div>
                        )}
                    </>
                  )}
                </div>)}
              </div>
            );
          })}
          {(isSubmitted || approval === 'false') && (
            <div className="col-md-12 mt-4">
              <div className="form-component">
                <label className="form-label">Approver Comment</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={comment}
                  disabled
                />
              </div>
            </div>
          )}
        </div>

            {/* Navigation and Action Buttons */}
            <div className="text-center mt-4">
              <div className="d-flex justify-content-between mb-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handlePrev}
                  disabled={currentResponseIndex === 0 || isFormLoading}
                >
                  Previous
                </button>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleNext}
                  disabled={isLastResponse || isFormLoading}
                >
                  Next
                </button>
              </div>

              {!isSubmitted && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={() => handleUpdate('in_progress')}
                    disabled={isFormLoading}
                  >
                    <i className="fa-regular fa-floppy-disk me-2"></i>
                    Save This Draft
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={() => handleUpdateAll('in_progress')}
                    disabled={isFormLoading}
                  >
                    <i className="fa-solid fa-floppy-disk me-2"></i>
                    Save All Drafts
                  </button>
                </>
              )}
              {isSubmitted &&  (
              <div>
            <span>
              {!isSubmitted && 'Last '} Approval Status: 
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
              )}
            </span>
                <br/>
              </div>)
              }
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleUpdateAll('submitted')}
                disabled={isSubmitted || !areAllFormsValid  || isFormLoading}
              >
            {
              isSubmitted ? (
                <span>
                  <i className="fa-solid fa-check me-2"></i>
                  Submitted
                </span>
              ) : (
                <span>
                 <i className="fa-solid fa-paper-plane me-2"></i>
                  {approval === 'false' ? (
                      'Submit Forms Again'
                  ) : (
                      'Submit Forms'
                  )}
                </span>
              )
            }
              </button>
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
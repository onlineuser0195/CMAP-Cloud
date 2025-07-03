import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import { formAPI, formResponseAPI, systemAPI } from '../../api/api';
import useAuth from '../../hooks/AuthContext';
import '../../styles/layouts/user/FillForm.css';
import { API_URL, FVS_FIELD_MAPPING, TRIMMED_ID, USER_ROLES } from '../../constants/constants';
import Tooltip from '@mui/material/Tooltip';
import EmbassyUserStepper from '../../components/stepper/EmbassyUserStepper';
import { Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-toastify';
import { logEvent } from '../../services/logger';
import 'react-toastify/dist/ReactToastify.css';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const FillForm = () => {
  const { userRole, mappedRole, userId } = useAuth();   
  const { respId, formId, systemId } = useParams();
  const [formData, setFormData] = useState({});
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [progress, setProgress] = useState('not_started');
  const [approval, setApproval] = useState('');
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [openPDF, setOpenPDF] = useState(false);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [pdfFieldId, setPdfFieldId] = useState(null);
  
  const handleOpenPDF = (filename) => {
    setPdfFileName(filename);
    setPdfFieldId(fieldid);
    setOpenPDF(true);
  }
  const handleClosePDF = () => {
    setOpenPDF(false);
    setPdfFileName(null);
    setPdfFieldId(null);
  }
  const [openInfo, setOpenInfo] = useState(false);
  const handleOpenInfo = () => setOpenInfo(true);
  const handleCloseInfo = () => setOpenInfo(false);
  const [formDetails, setFormDetails] = useState({
    name: '',
    description: '',
    systemName: '',
    file: null
  });
  const [visitorId, setVisitorId] = useState(null)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const formRes = await formAPI.getBuildForm(formId);
        setFields(formRes.data.fields);
        setFormDetails(prev => ({
          ...prev,
          name: formRes.data.name,
          description: formRes.data.description,
          file: formRes.data.info?.file_path || null
        }));

        const responseRes = await formResponseAPI.getFormResponse(respId, formId, systemId, userId);
        console.log('Response', responseRes);
        setIsSubmitted(responseRes.progress === 'submitted');
        setProgress(responseRes.progress);
        setApproval(responseRes.approved || '');
        setComment(responseRes.comment || '')
        setVisitorId(responseRes.display_id || '');
        const initialData = {};
        formRes.data.fields.forEach(field => {
          let value = responseRes.fields?.[String(field.field_id)];
          if (value === undefined || value === null) {
            if (field.type === 'checkbox') {
              value = [];
            } else if (field.type === 'attachment') {
              value = null;
            } else {
              value = '';
            }
          }

          initialData[field.field_id] = value;
        });
        setFormData(initialData);
        const systemRes = await systemAPI.getSystemDetails(systemId);

        setFormDetails(prev => ({
          ...prev,
          systemName: systemRes.data.name
        }));
      } catch (error) {
        console.error('Error:', error);
        toast.error(error.message || 'Failed to load form.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [formId]);

  useEffect(() => {
    if (isSubmitted) {
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => (input.disabled = true));
    }
  }, [isSubmitted]);

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleCheckboxChange = (fieldId, option) => {
    setFormData(prev => {
      const currentValues = prev[fieldId] || [];
      const newValues = currentValues.includes(option)
        ? currentValues.filter(v => v !== option)
        : [...currentValues, option];
      return { ...prev, [fieldId]: newValues };
    });
  };

  const isFormValid = useMemo(() => {
    return fields.every(field => {
      if (!field.required) return true;
      const value = formData[field.field_id];
      if (field.type === 'checkbox') {
        return Array.isArray(value) && value.length > 0;
      }
      if (field.type === 'attachment') {
        return value instanceof File;
      }
      return value !== undefined && value !== null && value !== '';
    });
  }, [fields, formData]);

  const handleUpdate = async (newProgress) => {
    try {
      const hasAttachment = fields.some(f => f.type === 'attachment');
      let submissionData;

      if (hasAttachment) {
        submissionData = new FormData();
        Object.entries(formData).forEach(([fieldId, value]) => {
          if (value instanceof File) {
            submissionData.append(fieldId, value);
          } else {
            submissionData.append(fieldId, JSON.stringify(value));
          }
        });
        submissionData.append('progress', newProgress);
      } else {
        submissionData = {};
        Object.entries(formData).forEach(([fieldId, value]) => {
          submissionData[fieldId] = value;
        });
      }

      await formResponseAPI.updateFormResponse(
        respId,
        formId,
        systemId,
        submissionData,
        newProgress,
        userId,
        hasAttachment // you may need this in your API wrapper
      );
      logEvent(userId, 'Request Submission', { newProgress, systemId, formId, respId });
      setIsSubmitted(newProgress === 'submitted');
      setProgress(newProgress);

      toast.success(`Request ${newProgress === 'submitted' ? 'submitted' : 'saved'} successfully!`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Submission failed.');
    }
  };
  function getStepperProps(progress, isSubmitted, approved) {
    let currentStageIndex;
    let submissionStatus = '';
    let approvalStatus = '';
  
    // Determine current stage
    if (!isSubmitted && !isFormValid) {
      currentStageIndex = 0;
    } else if (progress === 'not_started' || progress === 'in_progress') {
      currentStageIndex = 1; // Draft stage
    } else if (progress === 'submitted') {
      currentStageIndex = 2; // Submitted stage
      submissionStatus = 'submitted';
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
  
  const { currentStageIndex, submissionStatus, approvalStatus } = getStepperProps(
    progress,
    isSubmitted,
    approval
  );
 
  if (isLoading) return <div className="text-center mt-5">Loading form...</div>;

  return (
    <>
      <Box textAlign="center" mb={3}>
          {(mappedRole === USER_ROLES.APP_USER || mappedRole === USER_ROLES.CONFIRMATION_USER )&& 
            <EmbassyUserStepper 
            currentStageIndex={currentStageIndex}
            submissionStatus={submissionStatus}
            approvalStatus={approvalStatus}
          />}
      </Box>
    <div className="form-canvas p-3 d-flex pt-3 justify-content-center">
      <form className="fill-form">
        <div className="text-center mb-0 pt-5 mt-5">
        { formId !== '0' && mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole !== USER_ROLES.LOCAL_ADMIN && formDetails.file && <Tooltip placement="top-end" title="View Instruction Document">
              <div style={{ position: 'relative' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" onClick={handleOpenInfo} width="16" height="16" fill="currentColor" className="info-icon bi bi-info-circle-fill" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
                  </svg>
              </div>
            </Tooltip>}
          {/* <h2 className="fw-semibold mb-1">{formDetails.name}</h2> */}
          {/* <span className="fw-semibold mb-1">{formDetails.description}</span><br/> */}
          {/* <hr/> */}
          <small className="text-muted" >
            {/* System: <strong>{formDetails.systemName}</strong> <br/> */}
            {visitorId!=='' && (<>Visitor Req. ID: <strong> {visitorId.slice(-TRIMMED_ID)} </strong></> )}
            {formData[FVS_FIELD_MAPPING.fname] && <> | Name: <strong>{formData[FVS_FIELD_MAPPING.fname]} {formData[FVS_FIELD_MAPPING.mi]} {formData[FVS_FIELD_MAPPING.lname]}</strong></>}
                    {(isSubmitted || approval === 'false') && (
            <div>
            <span>
              {!isSubmitted && 'Last '} Approval Status: 
              {approval === 'true' ? (
                <>
                  <i className="fa-solid fa-circle-check m-2 mb-3" style={{ color: '#4CAF50' }}></i>
                  Approved
                </>
              ) : approval === 'false' ? (
                <>
                  <i className="fa-solid fa-circle-xmark m-2 mb-3" style={{ color: 'red' }}></i>
                  Rejected
                </>
              ) : (
                <>
                  <i className="fa-regular fa-clock m-2 mb-3" style={{ color: '#FFA500' }}></i>
                  Pending Review
                </>
              )}
            </span>
              <br/>
            </div>)
          }
          </small>
        </div>

        <div className="row g-2">
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
                  // <LocalizationProvider dateAdapter={AdapterDateFns}>
                  //   <DatePicker
                  //     label={field.label || "Select date"}  // Use the field's label or a default
                  //     value={formData[field.field_id] ? new Date(formData[field.field_id]) : null}
                  //     onChange={(newValue) => handleInputChange(field.field_id, newValue)}
                  //     disabled={isSubmitted}
                  //     minDate={field.minDate ? new Date(field.minDate) : undefined}
                  //     maxDate={field.maxDate ? new Date(field.maxDate) : undefined}
                  //     slotProps={{
                  //       textField: {
                  //         required: field.required,
                  //         className: "form-control",
                  //         size: 'small',
                  //       },
                  //     }}
                  //   />
                  // </LocalizationProvider>
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
                      top: '65%',
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
                                src={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${respId}/${field.field_id}/${formData[field.field_id].filename}`}
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
                              href={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${respId}/${field.field_id}/${formData[field.field_id].filename}`}
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
            <div className="col-md-12 mt-3">
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

        <div className="text-center mt-2 mb-0 pb-0">
        {(isSubmitted || approval === 'false') && (
            <div className='p-0 mb-3' style={{marginBottom: 0, paddingBottom: 0}}>
            <span className='p-0 m-0' style={{marginBottom: 0, paddingBottom: 0}}>
              {!isSubmitted && 'Last '} Approval Status: 
              {approval === 'true' ? (
                <span className='p-0 m-0' style={{marginBottom: 0, paddingBottom: 0}}>
                  <i className="fa-solid fa-circle-check m-2 mb-0" style={{ color: '#4CAF50' }}></i>
                  Approved
                </span>
              ) : approval === 'false' ? (
                <span className='p-0 m-0' style={{marginBottom: 0, paddingBottom: 0}}>
                  <i className="fa-solid fa-circle-xmark m-2 mb-0" style={{ color: 'red' }}></i>
                  Rejected
                </span>
              ) : (
                <span className='p-0 m-0' style={{marginBottom: 0, paddingBottom: 0}}>
                  <i className="fa-regular fa-clock m-2 mb-0" style={{ color: '#FFA500' }}></i>
                  Pending Review
                </span>
              )}
            </span>
              <br/>
            </div>)
          }
          {!isSubmitted && (
            <button
              type="button"
              className="btn btn-secondary mx-1 my-0 pt-1"
              onClick={() => handleUpdate('in_progress')}
            >
              <i className="fa-solid fa-floppy-disk me-2"></i>
              Save Draft
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary me-0s pt-1"
            id = "submit-form-button"
            onClick={() => handleUpdate('submitted')}
            disabled={isSubmitted || !isFormValid}
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
                      'Submit Again'
                  ) : (
                      'Submit Request'
                  )}
                </span>
              )
            }
          </button>
        </div>
      </form>
      <Dialog open={openPDF} onClose={handleClosePDF} maxWidth="md" fullWidth>
        <div style={{ height: '100vh' }}>
          <iframe
            src={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${respId}/${pdfFieldId}/${pdfFileName}`}
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

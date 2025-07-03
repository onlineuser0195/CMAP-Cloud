import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import { formAPI, formResponseAPI, systemAPI } from '../../../api/api';
import { projectManagerAPI } from '../../api/api';
import useAuth from '../../../hooks/AuthContext';
import '../../../styles/layouts/user/FillForm.css';
import { API_URL, FVS_FIELD_MAPPING, TRIMMED_ID, USER_ROLES, PRISM_FIELD_MAPPING, PRISM_PLANNED_FIELDS, PRISM_ACTUAL_FIELDS} from '../../../constants/constants';
import Tooltip from '@mui/material/Tooltip';
import EmbassyUserStepper from '../../../components/stepper/EmbassyUserStepper';
import { Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-toastify';
import { logEvent } from '../../../services/logger';
import BackButton from '../../../components/buttons/BackButton';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const PrismFillForm = () => {
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
  const navigate = useNavigate();

  
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
  const [govtLeads, setGovtLeads] = useState([]);
  useEffect(() => {
    const fetchGovtLeads = async () => {
      try {
        const res = await projectManagerAPI.getGovernmentLeads();
        // console.log(res.data)
        setGovtLeads(res.data);
      } catch (err) {
        console.error('Error loading government leads', err);
        toast.error('Could not load government leads');
      }
    };

    fetchGovtLeads();
  }, []);

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
        // console.log('Response', responseRes);
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
      logEvent(userId, 'Project Submission', { newProgress, systemId, formId, respId });
      setIsSubmitted(newProgress === 'submitted');
      setProgress(newProgress);

      toast.success(`Project ${newProgress === 'submitted' ? 'submitted' : 'saved'} successfully!`);
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
    if (progress === 'not_started' || progress === 'in_progress') {
      currentStageIndex = 1; // Draft stage
    } else if (progress === 'submitted') {
      currentStageIndex = 2; // Submitted stage
      submissionStatus = 'submitted';
      if (approved === 'true') {
        currentStageIndex = 2; // Approved stage
        approvalStatus = 'approved';
      } else if (approved === 'false') {
        currentStageIndex = 2; // Rejected stage
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
 

  const handleEmptyResponse = () => {
    // Check if progress is still 'not_started' or ''
    if (progress === 'not_started' || progress === '') {
      formResponseAPI
        .deleteResponse(formId, systemId, respId)
        .catch((err) => alert(err.response?.data?.message || err.message));
    }
    navigate(-1);
  };

  if (isLoading) return <div className="text-center mt-5">Loading form...</div>;

  return (
    <div className='mt-2 ml-4'>
    <BackButton label='Dashboard' onClick={handleEmptyResponse}/>
    <div className="form-canvas pt-1 p-3 d-flex justify-content-center">
      <form>
        <div className="text-center mb-4 pt-4">
        { formId !== '0' && mappedRole !== USER_ROLES.GLOBAL_ADMIN && mappedRole !== USER_ROLES.LOCAL_ADMIN && formDetails.file && <Tooltip placement="top-end" title="View Instruction Document">
              <div style={{ position: 'relative' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" onClick={handleOpenInfo} width="16" height="16" fill="currentColor" className="info-icon bi bi-info-circle-fill" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
                  </svg>
              </div>
            </Tooltip>}
          <h2 className="fw-semibold mb-1">{formDetails.name}</h2>
          {/* <span className="fw-semibold mb-1">{formDetails.description}</span><br/> */}
          <small className="text-muted">
            {/* System: <strong>{formDetails.systemName}</strong> <br/> */}
            {visitorId!=='' && (<>Project ID: <strong> {visitorId.slice(-TRIMMED_ID)} </strong></> )}
            {/* {formData[FVS_FIELD_MAPPING.fname] && <> | Name: <strong>{formData[FVS_FIELD_MAPPING.fname]} {formData[FVS_FIELD_MAPPING.mi]} {formData[FVS_FIELD_MAPPING.lname]}</strong></>} */}
          </small>
        </div>

<div className="row gy-1 gx-2">
  {(() => {
    // 1️⃣ Split into sections
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

    // 2️⃣ Render each section
    return sections.flatMap((section, sIdx) => {
      const out = [];

      let children = section;

      // Only render a section header if the first item has field_id===0
      if (section[0].field_id === 0) {
        const sec = section[0];
        const secCount = fields
          .slice(0, fields.indexOf(sec))
          .filter(x => x.field_id === 0).length;
        const letter = String.fromCharCode(65 + secCount);

        out.push(
          <div key={`sec-${sIdx}`} className="col-12 section-break mt-1">
            <div className="section-line" />
            <div className="section-header">
              <span className="section-title">Section {letter}</span>
            </div>
          </div>
        );

        // drop the header from children so we only render the real fields next
        children = section.slice(1);
      }

      // 3️⃣ Group by instruction
      const groups = [];
      let currInstr = null;
      let items = [];
      children.forEach(f => {
        if (f.type === 'instruction') {
          if (currInstr || items.length) groups.push({ instr: currInstr, items });
          currInstr = f;
          items = [];
        } else {
          items.push(f);
        }
      });
      if (currInstr || items.length) groups.push({ instr: currInstr, items });

      // 4️⃣ Render each instruction + its items
      groups.forEach(({ instr, items }, gIdx) => {
        // instruction header
        if (instr) {
          out.push(
            <div key={`instr-${sIdx}-${gIdx}`}   className={`col-12 full-width-instruction text-center text-red ${!instr.value ? 'd-none' : ''}`}>
              <label className="form-label">{instr.value}</label>
            </div>
          );
        }


        items.forEach(field => {
          const globalIndex = fields.findIndex(x => x.field_id === field.field_id);
          const colClass =
            items.length === 1 ? 'col-12'
            : items.length === 2 ? 'col-md-6'
            : globalIndex >= 33 && globalIndex <= 47 ? 'col-md-4'
            : 'col-md-3';

          out.push(
            <div key={field.field_id} className={colClass}>
              <div className="form-component" 
                  style={{
                    backgroundColor: Object.values(PRISM_PLANNED_FIELDS).includes(field.field_id)
                      ? '#fff8dc' :  // Light yellow
                      Object.values(PRISM_ACTUAL_FIELDS).includes(field.field_id)
                      ? '#d4edda' :  // Light green
                      'white'
                  }}
              >
                <label className="form-label" style={{
                    color: Object.values(PRISM_PLANNED_FIELDS).includes(field.field_id)
                      ? '#800000' :  // Maroon
                      Object.values(PRISM_ACTUAL_FIELDS).includes(field.field_id)
                      ? '#4c07d6' :  // Dark blue
                      'teal'
                }}>
                  {field.label}{field.required && <span className="required-star">*</span>}
                </label>

                {/* TEXT */}
                {field.type === 'text' && (
                  <input
                    type="text"
                    className="form-control"
                    value={formData[field.field_id] || ''}
                    onChange={e => handleInputChange(field.field_id, e.target.value)}
                    required={field.required}
                    placeholder={isSubmitted ? '' : field.placeholder}
                    disabled={isSubmitted || field.notEditableBy.includes(mappedRole)}
                  />
                )}

                {/* TEXTAREA */}
                {field.type === 'textarea' && (
                  <textarea
                    className="form-control"
                    rows={field.rows || 4}
                    value={formData[field.field_id] || ''}
                    onChange={e => handleInputChange(field.field_id, e.target.value)}
                    required={field.required}
                    placeholder={isSubmitted ? '' : field.placeholder}
                    disabled={isSubmitted}
                  />
                )}

                {/* SELECT */}
                {field.type === 'select' && field.field_id === PRISM_FIELD_MAPPING.governmentLead ? (
                  <select
                    className="form-select"
                    value={formData[field.field_id]?.id || ''}
                    onChange={e => {
                      const selectedId = e.target.value;
                      const selected = govtLeads.find(g => g._id === selectedId);
                      handleInputChange(field.field_id, {
                        id: selected._id,
                        name: `${selected.first_name} ${selected.last_name}`,
                        email: `${selected.email}`
                      });
                    }}
                    required={field.required}
                    disabled={isSubmitted}
                  >
                    <option value="">Select a Government Lead</option>
                    {govtLeads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.first_name} {lead.last_name} ({lead.email})
                      </option>
                    ))}
                  </select>
                ):                
                (field.type === 'select' && (
                  <select
                    className="form-select"
                    value={formData[field.field_id] || ''}
                    onChange={e => handleInputChange(field.field_id, e.target.value)}
                    required={field.required}
                    disabled={isSubmitted}
                  >
                    <option value="">Select an option</option>
                    {field.options.map((opt,i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ))}

                {/* CHECKBOX */}
                {field.type === 'checkbox' && (
                  <div className="checkbox-group">
                    {field.options.map((opt,i) => (
                      <div key={i} className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={(formData[field.field_id]||[]).includes(opt)}
                          onChange={() => handleCheckboxChange(field.field_id, opt)}
                          disabled={isSubmitted}
                        />
                        <label className="form-check-label">{opt}</label>
                      </div>
                    ))}
                  </div>
                )}

                {/* RADIO */}
                {field.type === 'radio' && (
                  <div className="radio-group">
                    {field.options.map((opt,i) => (
                      <div key={i} className="form-check">
                        <input
                          type="radio"
                          className="form-check-input"
                          name={`radio-${field.field_id}`}
                          value={opt}
                          checked={formData[field.field_id]===opt}
                          onChange={e => handleInputChange(field.field_id, e.target.value)}
                          disabled={isSubmitted}
                        />
                        <label className="form-check-label">{opt}</label>
                      </div>
                    ))}
                  </div>
                )}

                {/* DATE */}
                {field.type === 'date' && (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      className="form-control"
                      value={formData[field.field_id] || ''}
                      onChange={e => handleInputChange(field.field_id, e.target.value)}
                      required={field.required}
                      min={field.minDate}
                      max={field.maxDate}
                      disabled={isSubmitted}
                    />
                    <span style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }}>📅</span>
                  </div>
                )}

                {/* EMAIL */}
                {field.type === 'email' && (
                  <input
                    type="email"
                    className="form-control"
                    value={formData[field.field_id] || ''}
                    onChange={e => handleInputChange(field.field_id, e.target.value)}
                    required={field.required}
                    placeholder={isSubmitted ? '' : field.placeholder}
                    pattern={field.pattern || ''}
                    disabled={isSubmitted}
                  />
                )}

                {/* PHONE */}
                {field.type === 'phone' && (
                  <input
                    type="tel"
                    className="form-control"
                    value={formData[field.field_id] || ''}
                    onChange={e => handleInputChange(field.field_id, e.target.value)}
                    required={field.required}
                    placeholder={isSubmitted ? '' : field.placeholder}
                    pattern={field.pattern || ''}
                    disabled={isSubmitted}
                  />
                )}

                {/* NUMBER */}
                {field.type === 'number' && (
                  <input
                    type="number"
                    className="form-control"
                    value={formData[field.field_id] || ''}
                    onChange={e => handleInputChange(field.field_id, e.target.value)}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    disabled={isSubmitted}
                  />
                )}

                {/* ATTACHMENT */}
                {field.type === 'attachment' && (
                  <>
                    <input
                      type="file"
                      className="form-control"
                      accept={field.accept}
                      onChange={e => handleInputChange(field.field_id, e.target.files[0])}
                      disabled={isSubmitted}
                    />
                    {formData[field.field_id] &&
                      typeof formData[field.field_id] === 'object' &&
                      formData[field.field_id].filename && (
                        <div className="mt-0">
                          <small className="text-muted d-block mb-0">
                            Uploaded: <strong>{formData[field.field_id].originalname}</strong>
                          </small>
                          {formData[field.field_id].mimetype?.startsWith('image/') ? (
                            <img
                              src={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${respId}/${field.field_id}/${formData[field.field_id].filename}`}
                              alt="preview"
                              className="img-thumbnail mb-1"
                              style={{ maxHeight: 120 }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPDF(formData[field.field_id].filename, field.field_id)}
                              className="btn btn-sm btn-outline-primary me-2"
                            >
                              View
                            </button>
                          )}
                          <a
                            href={`${VITE_API_URL}/api/form-response/file/${systemId}/${formId}/${respId}/${field.field_id}/${formData[field.field_id].filename}`}
                            download={formData[field.field_id].originalname}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Download
                          </a>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          );
        });
      });

      return out;
    });
  })()}
</div>


        <div className="text-center mt-1">
          {/* {!isSubmitted && (
            <button
              type="button"
              className="btn btn-secondary me-2"
              onClick={() => handleUpdate('in_progress')}
            >
              <i className="fa-solid fa-floppy-disk me-2"></i>
              Save Project Details
            </button>
          )} */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleUpdate('submitted')}
            disabled={isSubmitted || !isFormValid}
          >
            {
              isSubmitted ? (
                <span>
                  <i className="fa-solid fa-check me-2"></i>
                  Project Initiated
                </span>
              ) : (
                <span>
                 <i className="fa-solid fa-paper-plane me-2"></i>
                  {approval === 'false' ? (
                      'Update Project'
                  ) : (
                      'Start Project'
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
    </div>
  );
};

// components/FormCanvas.jsx
import React, { useEffect, useState } from 'react';
import FieldModal from './FieldsModal';
import { fieldAPI } from '../../../api/api';
import '../../../styles/layouts/admin/form/FormCanvas.css';
import { toast } from 'react-toastify';

const FormCanvas = ({ components, updateComponent, deleteComponent }) => {
  const [labels, setLabels] = useState({
    text: [], select: [], checkbox: [],
    textarea: [], radio: [], date: [],
    email: [], phone: [], number: [],
    attachment: [], instruction: []
  });

  const [textboxes, setTextboxes] = useState([]);
  const [dropdowns, setDropdowns] = useState({});
  const [checkboxes, setCheckboxes] = useState({});
  const [textareas, setTextareas] = useState([]);
  const [radios, setRadios] = useState({});
  const [dateFields, setDateFields] = useState({});
  const [emailFields, setEmailFields] = useState({});
  const [phoneFields, setPhoneFields] = useState({});
  const [numberFields, setNumberFields] = useState({});
  const [attachments, setAttachments] = useState({});
  const [instructions, setInstructions] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);

  const [modalState, setModalState] = useState({
    show: false, isEditing: false, type: '', index: -1, fieldId: null,
  });
  const [newLabel, setNewLabel] = useState({
    label: '',
    options: [''],
    rows: 4,
    minDate: '',
    maxDate: '',
    placeholder: '',
    pattern: '',
    min: '',
    max: '',
    step: 1,
    required: false,
    notEditableBy: [],
    value: ''
  });

  useEffect(() => {
    if (modalState.show) {
      document.body.classList.add('no-scroll'); // Add no-scroll class to body
    } else {
      document.body.classList.remove('no-scroll'); // Remove no-scroll class from body
    }

    // Cleanup: Remove no-scroll class when component unmounts
    return () => {
      document.body.classList.remove('no-scroll');
    };

  }, [modalState.show]);

  const fetchData = async () => {
    try {
      const [
        textRes, dropdownRes, checkboxRes,
        textareaRes, radioRes, dateRes,
        emailRes, phoneRes, numberRes, attachmentRes, instructionRes
      ] = await Promise.all([
        fieldAPI.getFields('textboxes'),
        fieldAPI.getFields('dropdowns'),
        fieldAPI.getFields('checkboxes'),
        fieldAPI.getFields('textareas'),
        fieldAPI.getFields('radios'),
        fieldAPI.getFields('datefields'),
        fieldAPI.getFields('emailfields'),
        fieldAPI.getFields('phonefields'),
        fieldAPI.getFields('numberfields'),
        fieldAPI.getFields('attachments'),
        fieldAPI.getFields('instructions')
      ]);

      setTextboxes(textRes.data);
      setDropdowns(dropdownRes.data);
      setCheckboxes(checkboxRes.data);
      setTextareas(textareaRes.data);
      setRadios(radioRes.data);
      setDateFields(dateRes.data);
      setEmailFields(emailRes.data);
      setPhoneFields(phoneRes.data);
      setNumberFields(numberRes.data);
      setAttachments(attachmentRes.data);
      setInstructions(instructionRes.data);

      setLabels({
        text: textRes.data.map(i => i.label),
        select: Object.keys(dropdownRes.data),
        checkbox: Object.keys(checkboxRes.data),
        textarea: textareaRes.data.map(i => i.label),
        radio: Object.keys(radioRes.data),
        date: Object.keys(dateRes.data),
        email: Object.keys(emailRes.data),
        phone: Object.keys(phoneRes.data),
        number: Object.keys(numberRes.data),
        attachment: Object.keys(attachmentRes.data),
        instruction: instructionRes.data.map(i => i.label)
      });
      
      setIsHydrated(true);
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const getSectionCount = (index) => {
    return components.slice(0, index).filter(c => c.type === 'section').length;
  };

  const hydrateComponent = (comp) => {
    if (!comp.type) return comp;
    
    // For new components that haven't been saved yet
    if (!comp.field_id) {
      return {
        ...comp,
        label: comp.label || '',
        placeholder: comp.placeholder || '',
        options: comp.options || [],
        value: comp.value || '',
        required: comp.required || false,
        notEditableBy: comp.notEditableBy || [],
        // Add other default values for specific types
        ...(comp.type === 'textarea' && { rows: comp.rows || 4 }),
        ...(comp.type === 'number' && { 
          min: comp.min || '',
          max: comp.max || '',
          step: comp.step || 1
        }),
        ...(comp.type === 'date' && {
          minDate: comp.minDate || '',
          maxDate: comp.maxDate || ''
        }),
        ...(comp.type === 'attachment' && {
          accept: comp.accept || '',
          maxSizeMB: comp.maxSizeMB || ''
        })
      };
    }

    // For components with field_id, try to find in our fetched data
    const typeMap = {
      text: { data: textboxes, key: 'label' },
      select: { data: dropdowns, key: null },
      checkbox: { data: checkboxes, key: null },
      textarea: { data: textareas, key: 'label' },
      radio: { data: radios, key: null },
      date: { data: dateFields, key: null },
      email: { data: emailFields, key: null },
      phone: { data: phoneFields, key: null },
      number: { data: numberFields, key: null },
      attachment: { data: attachments, key: null },
      instruction: { data: instructions, key: 'label' }
    };

    const mapper = typeMap[comp.type];
    if (!mapper) return comp;

    let fieldData = {};
    
    if (mapper.key) {
      // For array-based data (text, textarea, instruction)
      fieldData = mapper.data.find(item => item.field_id === comp.field_id) || {};
    } else {
      // For object-based data (select, checkbox, etc.)
      const fieldKey = Object.keys(mapper.data).find(key => 
        mapper.data[key]?.field_id === comp.field_id
      );
      if (fieldKey) {
        fieldData = mapper.data[fieldKey] || {};
      }
    }

    return {
      ...comp,
      label: comp.label || fieldData.label || '',
      placeholder: comp.placeholder || fieldData.placeholder || '',
      options: comp.options || fieldData.options || [],
      value: comp.value || fieldData.value || '',
      required: comp.required || fieldData.required || false,
      notEditableBy: comp.notEditableBy || fieldData.notEditableBy || [],
      // Merge type-specific properties
      ...(comp.type === 'textarea' && { 
        rows: comp.rows || fieldData.rows || 4 
      }),
      ...(comp.type === 'number' && { 
        min: comp.min ?? fieldData.min ?? '',
        max: comp.max ?? fieldData.max ?? '',
        step: comp.step ?? fieldData.step ?? 1
      }),
      ...(comp.type === 'date' && {
        minDate: comp.minDate || fieldData.minDate || '',
        maxDate: comp.maxDate || fieldData.maxDate || ''
      }),
      ...(comp.type === 'attachment' && {
        accept: comp.accept || fieldData.accept || '',
        maxSizeMB: comp.maxSizeMB || fieldData.maxSizeMB || ''
      }),
      ...(comp.type === 'email' || comp.type === 'phone') && {
        pattern: comp.pattern || fieldData.pattern || ''
      }
    };
  };

  const handleLabelChange = (index, e) => {
    const value = e.target.value;
    if (value === 'add-new') {
      setModalState({
        show: true,
        isEditing: false,
        type: components[index].type,
        index,
        fieldId: null
      });
      return;
    }

    const type = components[index].type;
    let field_id = null;
    let opts = [];
    let extras = {};

    switch (type) {
      case 'text':
        const tb = textboxes.find(t => t.label === value);
        field_id = tb?.field_id;
        extras.placeholder = tb?.placeholder;
        extras.required = tb?.required ?? false;
        extras.notEditableBy = tb?.notEditableBy ?? [];
        break;
      case 'select':
        field_id = dropdowns[value]?.field_id;
        opts = dropdowns[value]?.options || [];
        extras.required = dropdowns[value]?.required ?? false;
        extras.notEditableBy = dropdowns[value]?.notEditableBy ?? [];
        break;
      case 'checkbox':
        field_id = checkboxes[value]?.field_id;
        opts = checkboxes[value]?.options || [];
        extras.required = checkboxes[value]?.required ?? false;
        extras.notEditableBy = checkboxes[value]?.notEditableBy ?? [];
        break;
      case 'textarea':
        const ta = textareas.find(t => t.label === value);
        field_id = ta?.field_id;
        extras.rows = ta?.rows;
        extras.placeholder = ta?.placeholder;
        extras.required = ta?.required ?? false;
        extras.notEditableBy = ta?.notEditableBy ?? [];
        break;
      case 'radio':
        field_id = radios[value]?.field_id;
        opts = radios[value]?.options || [];
        extras.required = radios[value]?.required ?? false;
        extras.notEditableBy = radios[value]?.notEditableBy ?? [];
        break;
      case 'date':
        field_id = dateFields[value]?.field_id;
        extras.minDate = dateFields[value]?.minDate;
        extras.maxDate = dateFields[value]?.maxDate;
        extras.required = dateFields[value]?.required ?? false;
        extras.notEditableBy = dateFields[value]?.notEditableBy ?? [];
        break;
      case 'email':
        field_id = emailFields[value]?.field_id;
        extras.placeholder = emailFields[value]?.placeholder;
        extras.pattern = emailFields[value]?.pattern;
        extras.required = emailFields[value]?.required ?? false;
        extras.notEditableBy = emailFields[value]?.notEditableBy ?? [];
        break;
      case 'phone':
        field_id = phoneFields[value]?.field_id;
        extras.placeholder = phoneFields[value]?.placeholder;
        extras.pattern = phoneFields[value]?.pattern;
        extras.required = phoneFields[value]?.required ?? false;
        extras.notEditableBy = phoneFields[value]?.notEditableBy ?? [];
        break;
      case 'number':
        field_id = numberFields[value]?.field_id;
        extras.min = numberFields[value]?.min;
        extras.max = numberFields[value]?.max;
        extras.step = numberFields[value]?.step;
        extras.required = numberFields[value]?.required ?? false;
        extras.notEditableBy = numberFields[value]?.notEditableBy ?? [];
        break;
      case 'attachment':
        field_id = attachments[value]?.field_id;
        extras.accept = attachments[value]?.accept;
        extras.maxSizeMB = attachments[value]?.maxSizeMB;
        extras.required = attachments[value]?.required ?? false;
        extras.notEditableBy = attachments[value]?.notEditableBy ?? [];
        break;
      case 'instruction':
        const ins = instructions.find(i => i.label === value);
        field_id = ins?.field_id;
        extras.value = ins?.value;
        break;  
      default:
        break;
    }

    updateComponent(index, {
      ...components[index],
      label: value,
      field_id,
      options: opts,
      ...extras
    });
  };

  const handleEditLabel = async (index) => {
    const comp = components[index];
    if (!comp.field_id) return;

    // map component.type to the API path
    const typeMap = {
      text: 'textboxes',
      select: 'dropdowns',
      checkbox: 'checkboxes',
      textarea: 'textareas',
      radio: 'radios',
      date: 'datefields',
      email: 'emailfields',
      phone: 'phonefields',
      number: 'numberfields',
      attachment: 'attachments',
      instruction: 'instructions'
    };
    const fieldType = typeMap[comp.type];

    try {
      const res = await fieldAPI.getField(fieldType, comp.field_id);
      const data = res.data;

      setNewLabel({
        label: data.label,
        options: data.options || [''],
        rows: data.rows || 4,
        minDate: data.minDate || '',
        maxDate: data.maxDate || '',
        placeholder: data.placeholder || '',
        pattern: data.pattern || '',
        min: data.min ?? '',
        max: data.max ?? '',
        step: data.step ?? 1,
        accept: data.accept ?? '',
        maxSizeMB: data.maxSizeMB ?? '',
        required: data.required ?? false,
        notEditableBy: data.notEditableBy ?? [],
        value: data.value ?? ''
      });

      setModalState({
        show: true,
        isEditing: true,
        type: comp.type,
        index,
        fieldId: comp.field_id
      });
    } catch (err) {
      console.error('Error fetching label data:', err);
      toast.error('Failed to load field for editing.');
    }
  };

  const handleOptionChange = (i, val) => {
    const opts = [...newLabel.options];
    opts[i] = val;
    setNewLabel(n => ({ ...n, options: opts }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const { type, index, fieldId, isEditing } = modalState;
    const base = { label: newLabel.label.trim() };
    // build payload
    const payload = { ...base };

    // type-specific
    if (type === 'select' || type === 'checkbox' || type === 'radio') {
      payload.options = newLabel.options.filter(o => o.trim());
    }
    if (type === 'textarea') payload.rows = newLabel.rows;
    if (type === 'date') {
      if (newLabel.minDate) payload.minDate = newLabel.minDate;
      if (newLabel.maxDate) payload.maxDate = newLabel.maxDate;
    }
    if (type === 'email' || type === 'phone') {
      payload.placeholder = newLabel.placeholder;
      payload.pattern = newLabel.pattern;
    }
    if (type === 'text' || type === 'textarea') {
      payload.placeholder = newLabel.placeholder;
    }
    if (type === 'number') {
      if (newLabel.min !== '') payload.min = newLabel.min;
      if (newLabel.max !== '') payload.max = newLabel.max;
      payload.step = newLabel.step;
    }
    if (type === 'attachment') {
      payload.accept = newLabel.accept;
      payload.maxSizeMB = newLabel.maxSizeMB;
    }
    if (type === 'instruction') 
      payload.value = newLabel.value;
    else {
      payload.required = newLabel.required;
      payload.notEditableBy = newLabel.notEditableBy;
    }

    // map type → endpoint
    const typeMap = {
      text: 'textboxes',
      select: 'dropdowns',
      checkbox: 'checkboxes',
      textarea: 'textareas',
      radio: 'radios',
      date: 'datefields',
      email: 'emailfields',
      phone: 'phonefields',
      number: 'numberfields',
      attachment: 'attachments',
      instruction: 'instructions'
    };
    const fieldType = typeMap[type];

    try {
      let resultId;
      if (isEditing) {
        const res = await fieldAPI.updateField(fieldType, fieldId, payload);
        resultId = res.data.field_id;
      } else {
        const res = await fieldAPI.postField(fieldType, payload);
        resultId = res.data.field_id;
      }

      await fetchData();
      updateComponent(index, {
        ...payload,
        field_id: resultId
      });
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error saving field');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this field?')) return;
    const { type, fieldId, index } = modalState;
    const typeMap = {
      text: 'textboxes',
      select: 'dropdowns',
      checkbox: 'checkboxes',
      textarea: 'textareas',
      radio: 'radios',
      date: 'datefields',
      email: 'emailfields',
      phone: 'phonefields',
      number: 'numberfields',
      attachment: 'attachments',
      instruction: 'instructions'
    };
    try {
      await fieldAPI.deleteField(typeMap[type], fieldId);
      await fetchData();
      updateComponent(index, { label: '', field_id: null, options: [] });
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error('Error deleting field');
    }
  };

  const closeModal = () => {
    setModalState(s => ({ ...s, show: false }));
    setTimeout(() => {
      setModalState({ show: false, isEditing: false, type: '', index: -1, fieldId: null });
      setNewLabel({
        label: '', options: [''], rows: 4,
        minDate: '', maxDate: '',
        placeholder: '', pattern: '',
        min: '', max: '', step: 1, required: false, notEditableBy: [], value: ''
      });
    }, 300);
  };

  // ... [keep all other methods the same as in your original code]

  if (!isHydrated) {
    return <div>Loading form components...</div>;
  }

  return (
    <div className="form-canvas">
      {components.map((comp, idx) => {
        const hydratedComp = hydrateComponent(comp);
        
        if (hydratedComp.type === 'section') {
          const sectionCount = getSectionCount(idx);
          const sectionLetter = String.fromCharCode(65 + sectionCount);
          
          return (
            <div key={idx} className="section-break">
              <div className="section-line"></div>
              <div className="section-header">
                <span className="section-title">Section {sectionLetter} </span>
                <span 
                  className="remove-section"
                  onClick={() => deleteComponent(idx)}
                  title="Remove section"
                >
                  <i className="fa-regular fa-circle-xmark"></i>
                </span>
              </div>
            </div>
          );
        } 

        return (
          <div key={idx} className={`form-component ${hydratedComp.type === 'instruction' ? 'full-width-instruction' : ''}`}>
            <button
              className="delete-component-btn"
              onClick={() => deleteComponent(idx)}
            >
              <i className="fa-regular fa-circle-xmark"></i>
            </button>

            <div className="label-control-group">
              <label>
                Select {hydratedComp.type.charAt(0).toUpperCase() + hydratedComp.type.slice(1)} Label:
                {hydratedComp.required && <span className="text-danger"> *</span>}
              </label>
              <div className="select-edit-container">
                <select
                  className="form-select mb-2"
                  value={hydratedComp.label || ''}
                  onChange={e => handleLabelChange(idx, e)}
                >
                  <option value="">Choose Label</option>
                  {labels[hydratedComp.type]?.map((lab, i) => (
                    <option key={i} value={lab}>{lab}</option>
                  ))}
                  <option value="add-new">
                    + Add New {hydratedComp.type.charAt(0).toUpperCase() + hydratedComp.type.slice(1)}
                  </option>
                </select>
                <button
                  className="edit-label-btn"
                  onClick={() => handleEditLabel(idx)}
                  disabled={!hydratedComp.label}
                  title="Edit label"
                >
                  <i className="fas fa-pencil-alt"></i>
                </button>
              </div>
            </div>

            {/* ——— Preview by type ——— */}
            {hydratedComp.type === 'text' && (
              <input 
                type="text" 
                className="form-control" 
                disabled 
                placeholder={hydratedComp.placeholder || ''} 
              />
            )}

            {hydratedComp.type === 'textarea' && (
              <textarea
                className="form-control"
                disabled
                rows={hydratedComp.rows || 4}
                placeholder={hydratedComp.placeholder || 'Textarea'}
              />
            )}

            {hydratedComp.type === 'select' && (
              <select className="form-select">
                {hydratedComp.options?.map((o, i) => 
                  <option key={i} value={o}>{o}</option>
                )}
              </select>
            )}

            {hydratedComp.type === 'radio' && (
              <div>
                {hydratedComp.options?.map((o, i) => (
                  <div key={i} className="form-check">
                    <input
                      type="radio"
                      name={`radio-${idx}`}
                      className="form-check-input"
                      disabled
                    />
                    <label className="form-check-label">{o}</label>
                  </div>
                ))}
              </div>
            )}

            {hydratedComp.type === 'checkbox' && (
              <div>
                {hydratedComp.options?.map((o, i) => (
                  <div key={i} className="form-check">
                    <input type="checkbox" className="form-check-input" disabled />
                    <label className="form-check-label">{o}</label>
                  </div>
                ))}
              </div>
            )}

            {hydratedComp.type === 'date' && (
              <input
                type="date"
                className="form-control"
                disabled
                min={hydratedComp.minDate || ''}
                max={hydratedComp.maxDate || ''}
              />
            )}

            {hydratedComp.type === 'email' && (
              <input
                type="email"
                className="form-control"
                disabled
                placeholder={hydratedComp.placeholder || ''}
                pattern={hydratedComp.pattern || ''}
              />
            )}

            {hydratedComp.type === 'phone' && (
              <input
                type="tel"
                className="form-control"
                disabled
                placeholder={hydratedComp.placeholder || ''}
                pattern={hydratedComp.pattern || ''}
              />
            )}

            {hydratedComp.type === 'number' && (
              <input
                type="number"
                className="form-control"
                disabled
                min={hydratedComp.min || ''}
                max={hydratedComp.max || ''}
                step={hydratedComp.step || 1}
              />
            )}

            {hydratedComp.type === 'attachment' && (
              <input
                type="file"
                className="form-control"
                disabled
                accept={hydratedComp.accept || ''}
                title={hydratedComp.maxSizeMB ? `Max size: ${hydratedComp.maxSizeMB}MB` : ''}
              />
            )}

            {hydratedComp.type === 'instruction' && (
              <div className='text-center'>
                {hydratedComp.value || ''}
              </div>
            )}
          </div>
        );
      })}

      <FieldModal
        key={`${modalState.fieldId}-${modalState.isEditing}`}
        isOpen={modalState.show}
        isEditing={modalState.isEditing}
        componentType={modalState.type}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        newLabel={newLabel}
        setNewLabel={setNewLabel}
        handleOptionChange={handleOptionChange}
        addOption={() => setNewLabel(n => ({ ...n, options: [...n.options, ''] }))}
        removeOption={i => setNewLabel(n => ({
          ...n,
          options: n.options.filter((_, idx) => idx !== i)
        }))}
      />
    </div>
  );
};

export default FormCanvas;
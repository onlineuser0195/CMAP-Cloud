  // components/FormCanvas.jsx
  import React, { useEffect, useState } from 'react';
  import FieldModal from './FieldsModal';
  import { fieldAPI } from '../../../api/api';
  import '../../../styles/layouts/admin/form/FormCanvas.css';

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

        // Default `required: false` if missing
        const safeData = (data) => ({
          ...data,
          required: data?.required ?? false,
        });

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
      } catch (err) {
        console.error('Error fetching form data:', err);
      }
    };

    useEffect(() => { fetchData(); }, []);

    const getSectionCount = (index) => {
      return components.slice(0, index).filter(c => c.type === 'section').length;
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
          extras.notEditableBy =  tb?.required ?? [];
          break;
        case 'select':
          field_id = dropdowns[value]?.field_id;
          opts = dropdowns[value]?.options || [];
          extras.required = dropdowns[value]?.required ?? false;
          extras.notEditableBy =  dropdowns[value]?.required ?? [];
          break;
        case 'checkbox':
          field_id = checkboxes[value]?.field_id;
          opts = checkboxes[value]?.options || [];
          extras.required = checkboxes[value]?.required ?? false;
          extras.notEditableBy =  checkboxes[value]?.required ?? [];
          break;
        case 'textarea':
          const ta = textareas.find(t => t.label === value);
          field_id = ta?.field_id;
          extras.rows = ta?.rows;
          extras.placeholder = ta?.placeholder;
          extras.required = ta?.required ?? false;
          extras.notEditableBy =  ta?.required ?? [];
          break;
        case 'radio':
          field_id = radios[value]?.field_id;
          opts = radios[value]?.options || [];
          extras.required = radios[value]?.required ?? false;
          extras.notEditableBy =  radios[value]?.required ?? [];
          break;
        case 'date':
          field_id = dateFields[value]?.field_id;
          extras.minDate = dateFields[value]?.minDate;
          extras.maxDate = dateFields[value]?.maxDate;
          extras.required = dateFields[value]?.required ?? false;
          extras.notEditableBy =  dateFields[value]?.required ?? [];
          break;
        case 'email':
          field_id = emailFields[value]?.field_id;
          extras.placeholder = emailFields[value]?.placeholder;
          extras.pattern = emailFields[value]?.pattern;
          extras.required = emailFields[value]?.required ?? false;
          extras.notEditableBy =  emailFields[value]?.required ?? [];
          break;
        case 'phone':
          field_id = phoneFields[value]?.field_id;
          extras.placeholder = phoneFields[value]?.placeholder;
          extras.pattern = phoneFields[value]?.pattern;
          extras.required = phoneFields[value]?.required ?? false;
          extras.notEditableBy =  phoneFields[value]?.required ?? [];
          break;
        case 'number':
          field_id = numberFields[value]?.field_id;
          extras.min = numberFields[value]?.min;
          extras.max = numberFields[value]?.max;
          extras.step = numberFields[value]?.step;
          extras.required = numberFields[value]?.required ?? false;
          extras.notEditableBy =  numberFields[value]?.required ?? [];
          break;
        case 'attachment':
          field_id = attachments[value]?.field_id;
          extras.accept = attachments[value]?.accept;
          extras.maxSizeMB = attachments[value]?.maxSizeMB;
          extras.required = attachments[value]?.required ?? false;
          extras.notEditableBy =  attachments[value]?.required ?? [];
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
        alert('Failed to load field for editing.');
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
        alert(err.response?.data?.message || 'Error saving field');
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
        alert('Error deleting field');
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

    return (
      <div className="form-canvas">
        {components.map((comp, idx) => {
          if (comp.type === 'section') {
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
            <div key={idx} className={`form-component ${comp.type === 'instruction' ? 'full-width-instruction' : ''}`}>
            {/* className="form-component" style={comp.type === 'instruction' ? { gridColumn: '1 / -1' } : {}}> */}
              <button
                className="delete-component-btn"
                onClick={() => deleteComponent(idx)}
              >
                <i className="fa-regular fa-circle-xmark"></i>
              </button>

              <div className="label-control-group">
                <label>
                  Select {comp.type.charAt(0).toUpperCase() + comp.type.slice(1)} Label:
                  {comp.required && <span className="text-danger"> *</span>}
                </label>
                <div className="select-edit-container">
                  <select
                    className="form-select mb-2"
                    value={comp.label || ''}
                    onChange={e => handleLabelChange(idx, e)}
                  >
                    <option value="">Choose Label</option>
                    {labels[comp.type]?.map((lab, i) => (
                      <option key={i} value={lab}>{lab}</option>
                    ))}
                    <option value="add-new">
                      + Add New {comp.type.charAt(0).toUpperCase() + comp.type.slice(1)}
                    </option>
                  </select>
                  <button
                    className="edit-label-btn"
                    onClick={() => handleEditLabel(idx)}
                    disabled={!comp.label}
                    title="Edit label"
                  >
                    <i className="fas fa-pencil-alt"></i>
                  </button>
                </div>
              </div>

              {/* ——— Preview by type ——— */}
              {comp.type === 'text' && (
                <input type="text" className="form-control" disabled placeholder={comp.placeholder} />
              )}

              {comp.type === 'textarea' && (
                <textarea
                  className="form-control"
                  disabled
                  rows={comp.rows || 4}
                  placeholder="Textarea"
                />
              )}

              {comp.type === 'select' && (
                <select className="form-select">
                  {comp.options.map((o, i) => <option key={i}>{o}</option>)}
                </select>
              )}

              {comp.type === 'radio' && (
                <div>
                  {comp.options.map((o, i) => (
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

              {comp.type === 'checkbox' && (
                <div>
                  {comp.options.map((o, i) => (
                    <div key={i} className="form-check">
                      <input type="checkbox" className="form-check-input" disabled />
                      <label className="form-check-label">{o}</label>
                    </div>
                  ))}
                </div>
              )}

              {comp.type === 'date' && (
                <input
                  type="date"
                  className="form-control"
                  disabled
                  min={comp.minDate}
                  max={comp.maxDate}
                />
              )}

              {comp.type === 'email' && (
                <input
                  type="email"
                  className="form-control"
                  disabled
                  placeholder={comp.placeholder}
                  pattern={comp.pattern}
                />
              )}

              {comp.type === 'phone' && (
                <input
                  type="tel"
                  className="form-control"
                  disabled
                  placeholder={comp.placeholder}
                  pattern={comp.pattern}
                />
              )}

              {comp.type === 'number' && (
                <input
                  type="number"
                  className="form-control"
                  disabled
                  min={comp.min}
                  max={comp.max}
                  step={comp.step}
                />
              )}
              {comp.type === 'attachment' && (
                <input
                  type="file"
                  className="form-control"
                  disabled
                  accept={comp.accept}
                  title={`Max size: ${comp.maxSizeMB}MB`}
                />
              )}
              {comp.type === 'instruction' && (
                <div className='text-center'>
                  {comp.value}
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
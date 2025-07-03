// components/FormSidebar.jsx
import React from 'react';
import "../../../styles/layouts/admin/form/FormSidebar.css";

const FormSidebar = ({ addComponent }) => {

  const generateFieldId = () => Math.floor(Math.random() * 1000);

  const handleAddTextbox = () => {
    addComponent({ type: 'text', label: '', field_id: Math.floor(Math.random() * 1000) });
  };

  const handleAddDropdown = () => {
    addComponent({ type: 'select', label: '', options: [], field_id: Math.floor(Math.random() * 1000) });
  };

  const handleAddCheckbox = () => {
    addComponent({ type: 'checkbox', label: '', options: [], field_id: Math.floor(Math.random() * 1000) });
  };

  const handleAddTextarea = () => {
    addComponent({ type: 'textarea', label: '', field_id: generateFieldId(), rows: 4 });
  };

  const handleAddRadio = () => {
    addComponent({ type: 'radio', label: '', options: [], field_id: generateFieldId() });
  };

  const handleAddDate = () => {
    addComponent({ type: 'date', label: '', field_id: generateFieldId(), minDate: null, maxDate: null });
  };

  const handleAddEmail = () => {
    addComponent({
      type: 'email',
      label: '',
      field_id: generateFieldId(),
      placeholder: '',
      pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
    });
  };

  const handleAddPhone = () => {
    addComponent({
      type: 'phone',
      label: '',
      field_id: generateFieldId(),
      placeholder: 'e.g., (123) 456-7890',
      pattern: "^\\+?\\d{10,15}$"
    });
  };

  const handleAddNumber = () => {
    addComponent({ type: 'number', label: '', field_id: generateFieldId(), min: null, max: null, step: 1 });
  };

  const handleAddAttachment = () => {
    addComponent({ type: 'attachment', label: '', field_id: generateFieldId(), accept: null, maxSizeMB: 10 });
  };

  const handleAddSection = () => {
    addComponent({ type: 'section', field_id: 0});
  };

  const handleAddInstruction = () => {
    addComponent({ type: 'instruction', label: '', field_id: generateFieldId(), value: ''});
  };

  return (
    <div>
      <h4>Form Components</h4>
      <button onClick={handleAddTextbox} className="btn btn-outline-primary w-100 mt-0">
        Add Textbox
      </button>
      <button onClick={handleAddDropdown} className="btn btn-outline-primary w-100 mt-1">
        Add Dropdown
      </button>
      <button onClick={handleAddCheckbox} className="btn btn-outline-primary w-100 mt-1">
        Add Checkbox
      </button>
      <button onClick={handleAddTextarea} className="btn btn-outline-primary w-100 mt-1">
        Add Textarea
      </button>
      <button onClick={handleAddRadio} className="btn btn-outline-primary w-100 mt-1">
        Add Radio
      </button>
      <button onClick={handleAddDate} className="btn btn-outline-primary w-100 mt-1">
        Add Date Field
      </button>
      <button onClick={handleAddEmail} className="btn btn-outline-primary w-100 mt-1">
        Add Email Field
      </button>
      <button onClick={handleAddPhone} className="btn btn-outline-primary w-100 mt-1">
        Add Phone Field
      </button>
      <button onClick={handleAddNumber} className="btn btn-outline-primary w-100 mt-1">
        Add Number Field
      </button>
      <button onClick={handleAddAttachment} className="btn btn-outline-primary w-100 mt-1">
        Add Attachment
      </button>
      <button onClick={handleAddSection}  className="btn btn-outline-primary w-100 mt-1">
        Add Section
      </button>
      <button onClick={handleAddInstruction}  className="btn btn-outline-primary w-100 mt-1">
        Add Instruction
      </button>
    </div>
  );
};

export default FormSidebar;
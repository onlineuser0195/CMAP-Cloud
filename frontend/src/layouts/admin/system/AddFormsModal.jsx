// AddFormsModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { systemAPI  } from '../../../api/api';
// import { getAvailableForms, addFormsToSystem  } from '../../api/api';
import axios from 'axios';
import '../../../styles/layouts/admin/FormsModal.css';


const AddFormsModal = ({ show, onHide, systemId, refreshForms }) => {
  const [selectedForms, setSelectedForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [forms, setForms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchForms = async () => {
      try {
      const formsData = await systemAPI.getAvailableForms(systemId);
      console.log('Forms Data:', formsData);
      setForms(formsData);
      } catch (error) {
      console.error('Error fetching forms:', error);
      setError('Failed to load forms.');  // Optional: Display error if fetching fails
      }
    };
    if (show) fetchForms();
}, [show]);

  const handleSubmit = async () => {
    try {
      await systemAPI.addFormsToSystem(systemId, selectedForms);
      if (refreshForms) { // Ensure it's defined before calling
        await refreshForms();
      }
      onHide();
    } catch (error) {
      console.error('Error adding forms:', error);
    }
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add Existing Forms</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="form-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {filteredForms.map(form => (
            <div key={form.form_id} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={selectedForms.includes(form.form_id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedForms([...selectedForms, form.form_id]);
                  } else {
                    setSelectedForms(selectedForms.filter(id => id !== form.form_id));
                  }
                }}
              />
              <label className="form-check-label">
                {form.form_id}. {form.name}
              </label>
            </div>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Add Selected Forms</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddFormsModal;
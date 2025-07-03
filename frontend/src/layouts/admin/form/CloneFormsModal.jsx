// CloneFormsModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { formAPI } from '../../../api/api';
import '../../../styles/layouts/admin/FormsModal.css';


const CloneFormsModal = ({ show, onHide, refreshForms }) => {
  const [selectedForms, setSelectedForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [forms, setForms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchForms = async () => {
      try {
      const formsData = await formAPI.getAllForms(0);
      console.log('Forms Data:', formsData);
      setForms(formsData);
      } catch (error) {
      console.error('Error fetching forms:', error);
      setError('Failed to load forms.');  // Optional: Display error if fetching fails
      }
    };
    if (show) fetchForms();
}, [show]);

  const handleCloning = async () => {
    try {
      // Send form_ids in proper request body format
      await formAPI.cloneForms({ form_ids: selectedForms }); // Wrap in object
      if (refreshForms) await refreshForms();
      onHide();
    } catch (error) {
      console.error('Error cloning forms:', error);
      // Add error feedback to user
    }
  };
  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Clone Forms</Modal.Title>
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
        <Button variant="primary" onClick={handleCloning}>Clone Selected Forms</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CloneFormsModal;
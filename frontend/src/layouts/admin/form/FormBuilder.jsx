import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formAPI } from '../../../api/api';
import FormSidebar from './FormSidebar';
import FormCanvas from './FormCanvas';
import "../../../styles/layouts/admin/form/FormBuilder.css";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FormBuilder = () => {
  const { formId } = useParams(); // Get formId from the URL
  console.log('form id is ', formId)
  const [components, setComponents] = useState([]);
  const [formDetails, setFormDetails] = useState({
    name: '',
    description: ''
  });
  

  // Fetch form details when the component mounts
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await formAPI.getBuildForm(formId);
        const { fields } = response.data;
        console.log('get build form',fields)
        setFormDetails({
          name: response.data.name,
          description: response.data.description
        });

        // Map fields to components
        const mappedComponents = fields.map(field => ({
          type: field.type,
          label: field.label,
          options: field.options || [], // For dropdown and checkbox
          field_id: field.field_id,
        }));

        setComponents(mappedComponents);
      } catch (error) {
        console.error('Error fetching form:', error);
      }
    };

    fetchForm();
  }, [formId]);

  // Add a new component to the form
  const addComponent = (component) => {
    setComponents([...components, component]);
  };

  // Update an existing component
  const updateComponent = (index, newData) => {
    setComponents(components.map((comp, i) => (i === index ? { ...comp, ...newData } : comp)));
  };

  // Add this delete function
  const deleteComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const saveForm = async () => {
    const invalidComponents = components.filter(comp => comp.type !== 'section' && (!comp.label || !comp.field_id));
    console.log(invalidComponents)
    if (invalidComponents.length > 0) {
      toast.error('Please select a label for all components before saving.');
      return;
    }
  
    try {
      const fieldIds = components.map(component => component.field_id);
      console.log('Building field ids', fieldIds);
      if (formId === '0') {
        await formAPI.buildForm(formId, fieldIds);
      } else {
        await formAPI.updateBuildForm(formId, fieldIds);
      }
      toast.success('Form saved successfully!');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form. Please try again.');
    }
  };

  
  return (
    <div className="container-fluid">
      <h2 className="mb-4 pt-4 text-center">{formDetails.name}</h2>
      <div className="row">
        <div className="col-3 bg-light p-3 text-center form-sidebar">
          <FormSidebar addComponent={addComponent} />
        </div>
        <div className="col-9 p-3 formbuilder-canvas">
          <FormCanvas components={components} updateComponent={updateComponent} deleteComponent={deleteComponent}/>
          {components.length >0 && <div className="d-flex justify-content-center mt-3">
            <button id="saveForm" onClick={saveForm} className="btn btn-primary mt-3">
              Save Form
            </button>
          </div>}
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
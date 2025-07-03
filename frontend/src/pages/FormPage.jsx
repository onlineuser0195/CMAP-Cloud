import React from 'react';
import FormBuilder from '../layouts/admin/form/FormBuilder';
import BackButton from '../components/buttons/BackButton';

const FormPage = () => (
  <div>
    <BackButton label='Form Details'/>
    <h1 className="text-center my-4">Form Builder</h1>
    <FormBuilder />
  </div>
);
// Add section_ids and put field_ids into that
export default FormPage;
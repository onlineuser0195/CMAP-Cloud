import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const getAllForms = async (systemId) => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/forms/${systemId}`);
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const getAllSystemForms = async (systemId, status, approved) => {
  try {
      const response = await axios.get(`${VITE_API_URL}/api/system-forms/${systemId}`, {
        params: {
          ...(status && { status }),
          ...(approved !== undefined && { approved })
        }
      });      
      return response.data;
  } catch (error) {
      console.error('API Error:', error);
      throw error;
  }
};

export const getBuildForm = async (formId) => {
  try {
      const response = await axios.get(`${VITE_API_URL}/api/build-form/${formId}`);
      return response;
  } catch (error) {
      console.error('API Error:', error);
      throw error;
  }
};


export const updateBuildForm = async (formId, fieldIds) => {
  try {
    console.log(fieldIds);
    // Use the format you want with template literals
    const response = await axios.patch(`${VITE_API_URL}/api/build-form/${formId}`, {
      field_ids: fieldIds
    });
    return response;
  } catch (error) {
    console.error('Error updating form:', error);
    throw error;  // Optionally rethrow to handle errors in component
  }
};

export const buildForm = async (formId, fieldIds) => {
  try {
    // Use the format you want with template literals
    const response = await axios.post(`${VITE_API_URL}/api/build-form/${formId}`, {
      field_ids: fieldIds
    });
    return response;
  } catch (error) {
    console.error('Error updating form:', error);
    throw error;  // Optionally rethrow to handle errors in component
  }
};

export const getFormDetails = async (formId) => {
  try {
      const response = await axios.get(`${VITE_API_URL}/api/form-details/${formId}`);
      return response;
  } catch (error) {
      console.error('API Error:', error);
      throw error;
  }
};

export const updateFormDetails = async (formId, formDetails) => {
  try {
    const response = await axios.patch(`${VITE_API_URL}/api/form-details/${formId}`, formDetails, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response;
  } catch (error) {
    console.error('Error updating form:', error);
    throw error;
  }
};


export const createForm = async (formDetails) => {
  try {
    const response = await axios.post(`${VITE_API_URL}/api/form-details`, formDetails, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response;
  } catch (error) {
    console.error('Error creating form:', error);
    throw error;
  }
};


// API call to delete a form completely and remove form all systems
export const deleteForm = async (formId) => {
    try {
      const response = await axios.delete(`${VITE_API_URL}/api/delete-form/${formId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting form:', error);
      throw error;
    }
  };

  // API call to update active status of the form
export const updateActiveStatus = async (formId, activeStatus) => {
  try {
    const response = await axios.patch(`${VITE_API_URL}/api/active-status/${formId}`,  { active: activeStatus });
    return response.data;
  } catch (error) {
    console.error('Error updateing active status form:', error);
    throw error;
  }
};
  
  // API call to clone multiple forms
  export const cloneForms = async (bodyData) => {
    try {
      const response = await axios.post(`${VITE_API_URL}/api/clone-forms`, bodyData);
      return response.data;
    } catch (error) {
      console.error('Error cloning forms:', error);
      throw error;
    }
  };

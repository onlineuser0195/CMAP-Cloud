import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const getAvailableForms = async (systemId) => {
  try {
    const response = await axios.get(`${VITE_API_URL}/api/available-forms/${systemId}`);
    return response.data;
  } catch (error) {
    console.error('API Error', error);
    throw error;
  }
};

export const getAllSystems = async () => {
  try {
    const response = await axios.get(`${VITE_API_URL}/api/systems`);
    return response.data;
  } catch (error) {
    console.error('API Error', error);
    throw error;
  }
};

export const addFormsToSystem = async (systemId, formIds) => {
  try {
    const response = await axios.patch(`${VITE_API_URL}/api/system/${systemId}/add-forms`,{
      form_ids: formIds // Send form IDs in the request body
    });
    return response.data;
  } catch (error) {
    console.error('API Error', error);
    throw error;
  }
};

  // API call to remove a form from the system (removes from forms_id list)
export const removeFormFromSystem = async (systemId, formId) => {
  try {
    const response = await axios.patch(`${VITE_API_URL}/api/system/${systemId}/remove-form/${formId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing form from system:', error);
    throw error;
  }
};

  // API call to remove a form from the system (removes from forms_id list)
  export const getSystemDetails = async (systemId) => {
    try {
      const response = await axios.get(`${VITE_API_URL}/api/system/${systemId}`);
      return response;
    } catch (error) {
      console.error('Error getting system details', error);
      throw error;
    }
  };

    // API call to remove a form from the system (removes from forms_id list)
    export const createSystem = async (systemDetails) => {
      try {
        const response = await axios.post(`${VITE_API_URL}/api/system`, systemDetails);
        return response;
      } catch (error) {
        console.error('Error creating system', error);
        throw error;
      }
    };

      // API call to remove a form from the system (removes from forms_id list)
  export const updateSystemDetails = async (systemId, systemDetails) => {
    try {
      const response = await axios.patch(`${VITE_API_URL}/api/system/${systemId}`, systemDetails);
      return response;
    } catch (error) {
      console.error('Error Updating system', error);
      throw error;
    }
  };

  // API call to remove a form from the system (removes from forms_id list)
  export const deleteSystem = async (systemId) => {
    try {
      const response = await axios.delete(`${VITE_API_URL}/api/delete-system/${systemId}`);
      return response;
    } catch (error) {
      console.error('Error Deleting system', error);
      throw error;
    }
  };


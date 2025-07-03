import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const getSystemOverview = async (params) => {
    try {
      const response = await axios.get(`${VITE_API_URL}/api/dashboard/overview`, { 
        params
       });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load dashboard data');
    }
};

export const getFormOverview = async (formId) => {
  try {
    const response = await axios.get(`${VITE_API_URL}/api/dashboard/form-overview`, { 
      params: formId ? { formId } : {}
     });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to load dashboard data');
  }
};

export const getFormsByStatus = async (status) => {
  try {
    const response = await axios.get(`${VITE_API_URL}/api/forms-status/${status}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to load dashboard data');
  }
};

import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const updateFormResponse = async (respId, formId, systemId, data, progress, userId, isMultipart = false, groupId = null) => {
  try {
    const config = {
      headers: {
        ...(isMultipart
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' }),
      },
    };

    // If using FormData, progress is already appended on the frontend
    const payload = isMultipart
      ? data
      : { fields: data, progress, groupId, userId };

    // Only use append for FormData (multipart)
    if (isMultipart) {
      if (groupId !== null) {
        payload.append('groupId', groupId);
      }
      payload.append('userId', userId);
    }
    const response = await axios.patch(
      `${VITE_API_URL}/api/form-response/${respId}/${formId}/${systemId}`,
      payload,
      config
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Failed to save form. Please try again.'
    );
  }
};

// formResponseAPI.jsx
export const getFormResponse = async (respId, formId, systemId, userId) => {
    try {
      const response = await axios.get(`${VITE_API_URL}/api/form-response/${respId}/${formId}/${systemId}`, { params: {userId} } );
      return response.data;
    } catch (error) {
      if (error.response) {
        // Server responded with status code outside 2xx
        console.error('Error fetching response:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch form response');
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        throw new Error('Network error - please check your connection');
      } else {
        // Other errors
        console.error('Error:', error.message);
        throw error;
      }
    }
  };

  export const updateFormApproval = async (respId, formId, systemId, approved, comment, userId) => {
    try {
      const response = await axios.patch(
        `${VITE_API_URL}/api/form-approval/${respId}/${formId}/${systemId}`,
        { approved, comment, userId } // Send direct field data
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || 
        'Failed to save form. Please try again.'
      );
    }
  };

  export const getFormResponses = async (formId, systemId, groupId = null, userRole = null, userId = null) => {
    try {
      const params = {};
      if (groupId) params.groupId = groupId;
      if (userRole && userId) {
        params.userRole = userRole;
        params.userId = userId;
      }


      const response = await axios.get(`${VITE_API_URL}/api/form-responses/${formId}/${systemId}`, { params });
      return response.data;
    } catch (error) {
      if (error.response) {
        // Server responded with status code outside 2xx
        console.error('Error fetching response:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch form response');
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        throw new Error('Network error - please check your connection');
      } else {
        // Other errors
        console.error('Error:', error.message);
        throw error;
      }
    }
  };

  export const getResponseStatus = async (formId, systemId, status = null, approved = null) => {
    try {
      const params = {};
      if (status) params.status = status;
      if (approved) params.approved = approved;
  
      const response = await axios.get(`${VITE_API_URL}/api/systems/${systemId}/forms/${formId}/response-status`, { params });
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('Error fetching responses:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch form responses');
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('Network error - please check your connection');
      } else {
        console.error('Error:', error.message);
        throw error;
      }
    }
  };
  
  export const getGroupResponses = async (formId, systemId, groupId) => {
    return axios.get(`${VITE_API_URL}/api/form-responses/group/${groupId}`);
  }

  export const deleteResponse = async ( formId, systemId, respId=null, groupId=null) => {
    try {
      const params = {};
      if (groupId) params.groupId = groupId;
      if (respId) params.respId = respId;

      const response = await axios.delete(`${VITE_API_URL}/api/form-responses/${formId}/${systemId}`, { params });
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('Error fetching responses:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch form responses');
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('Network error - please check your connection');
      } else {
        console.error('Error:', error.message);
        throw error;
      }
    }
};

export const updateFormProgress = async (respId, formId, systemId, progress, userId) => {
  try {

    const response = await axios.patch(
      `${VITE_API_URL}/api/form-progress/${respId}/${formId}/${systemId}`,
      { progress, userId } 
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Failed to update progress.'
    );
  }
};

// api/formResponseAPI.js
export const getMaxDisplayId = async (formId, systemId) => {
  try {
    const response = await axios.get(
      `${VITE_API_URL}/api/form-responses/max-display-id/${formId}/${systemId}` // Include both IDs in URL
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching max display ID:', error);
    throw error;
  }
};
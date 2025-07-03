import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const getFields = async (fieldType) => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/${fieldType}`);
        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const getField = async (fieldType, fieldId) => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/${fieldType}/${fieldId}`);
        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const postField = async (fieldType, data) => {
    try {
        const response = await axios.post(`${VITE_API_URL}/api/${fieldType}`, data);
        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const updateField = async (fieldType, fieldId, data) => {
    try {
        const response = await axios.put(`${VITE_API_URL}/api/${fieldType}/${fieldId}`, data);
        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const deleteField = async (fieldType, fieldId) => {
    try {
        const response = await axios.delete(`${VITE_API_URL}/api/${fieldType}/${fieldId}`);
        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

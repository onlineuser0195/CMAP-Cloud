import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const getAllVisitRequests = async () => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/fvs-admin/visit-requests`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to load visit requests data');
    }
}

export const getVisitRequestsAlert = async () => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/fvs-admin/visit-alerts`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to load visit alerts data');
    }
}

export const startModelTraining = async () => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/fvs-admin/train-model`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to train model');
    }
}

export const startDataTesting = async () => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/fvs-admin/test-data`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to test data');
    }
}

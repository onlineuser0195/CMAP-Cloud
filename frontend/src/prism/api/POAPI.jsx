import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const getAllProjectDetails = async () => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/prism/portfolio-owner/project-details`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to load project details');
    }
}

export const getProjectStatusCount = async (userRole, userId) => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/prism/portfolio-owner/project-status/${userRole}/${userId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to load project status');
    }
}

export const getProjectDataForGantt = async (userRole, userId) => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/prism/portfolio-owner/project-chart/${userRole}/${userId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to load project status');
    }
}
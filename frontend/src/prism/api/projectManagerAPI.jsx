import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;
 
export const getGovernmentLeads = async () => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/prism/project-manager/government-leads`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to load government leads');
    }
}
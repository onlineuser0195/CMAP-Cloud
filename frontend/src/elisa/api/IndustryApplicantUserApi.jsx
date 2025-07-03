import axios from 'axios';

export const getCaseDetails = async (caseNumber) => {
    try {
        const response = await axios.get(`/api/elisa/industry-applicant/case/${caseNumber}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch case details');
    }
}


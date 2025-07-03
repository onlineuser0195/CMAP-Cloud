import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const getVisitsForConfirmationUser = async (confirmationUserId) => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/confirmation-user/${confirmationUserId}/visits`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to load locations data');
    }
}

export const updateVisitorStatus = async (groupId, visitorId, status, confirmationUserId) => {
    try {
        const response = await axios.patch(`${VITE_API_URL}/api/confirmation-user/visits/${groupId}/visitors/${visitorId}/status`,
            {
                status,
                confirmationUserId,
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update visitors status');
    }
}

export const updateVisitRemarks = async (visitId, remarks) => {
    try {
        const response = await axios.patch(`${VITE_API_URL}/api/confirmation-user/visits/${visitId}/remarks`,
            { remarks }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update visit remark');
    }
}
import axios from 'axios';

export const getLastSyncTimeForUsxportsReport = async () => {
    try {
        const response = await axios.get(`/api/elisa/span-user/sync-time`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch sync time');
    }
}

export const uploadSpanReports = async (formData) => {
    try {
        const response = await axios.post(`/api/elisa/span-user/upload-report`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
}
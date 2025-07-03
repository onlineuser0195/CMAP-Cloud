import axios from 'axios';

export const uploadUsxportsReports = async (formData) => {
    try {
        const response = await axios.post(`/api/elisa/it-user/upload-report`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
}

export const getUsxportsReports = async () => {
    try {
        const response = await axios.get(`/api/elisa/it-user/reports`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch reports');
    }
}


import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/', // Your API base URL
});

// Add request interceptor to include the token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Get token from storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
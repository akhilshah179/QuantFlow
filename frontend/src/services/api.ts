import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quantflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const resData = response.data;
    if (resData && typeof resData === 'object' && 'data' in resData) {
      return resData.data;
    }
    return resData;
  },
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default api;

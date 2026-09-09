import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1.0',
  timeout: 5000,
});

export default apiClient;

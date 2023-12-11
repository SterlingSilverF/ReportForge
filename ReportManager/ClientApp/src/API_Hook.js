import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const API_Hook = {
  baseURL: axios.defaults.baseURL = config.baseURL,

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  },

  decodeToken() {
    const token = localStorage.getItem('token');
    return token ? jwt_decode(token) : null;
  },

  async get(endpoint) {
    try {
      const response = await axios.get(endpoint, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  },

  // ... Include other methods for POST, PUT, DELETE, etc.

  handleError(error) {
    console.error('API call error: ', error.response?.data || error.message);
    if (error.response?.status === 401) {
        navigate('/login');
    }
    throw error;
  }
};

export default API_Hook;
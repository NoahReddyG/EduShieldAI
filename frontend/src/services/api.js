/**
 * api.js — EduShieldAI Axios Instance
 * Centralized HTTP client with base URL, auth interceptor, and error handling.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Request Interceptor: Attach JWT Bearer token ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edushield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Normalize errors ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('edushield_token');
      localStorage.removeItem('edushield_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;

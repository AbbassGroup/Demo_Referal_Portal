// Use the deployed backend URL for production, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'https://referral-backend-c7os.onrender.com/api';

// API Configuration
export const API_CONFIG = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false  // Set to false to avoid CORS preflight issues
};

// Auth token management
export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/api/login',  // Use the unified login route directly
  ADMIN_DASHBOARD: '/api/admin/dashboard',
  PARTNERS: '/api/partners',
  REFERRALS: '/api/referrals',
  PARTNER_REFERRALS: '/api/partner/referrals',
  SETTLED_REFERRALS: '/api/settled-referrals',
  PARTNER_VALIDATE: '/api/partner/validate'
};

export default API_URL;
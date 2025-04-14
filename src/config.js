// Use the deployed backend URL for production, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'https://referral-backend-c7os.onrender.com';

// API Configuration
export const API_CONFIG = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false  // Set to false to avoid CORS preflight issues
};

// Auth token management
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/login',  // Remove /api prefix to avoid double /api
  ADMIN_DASHBOARD: '/admin/dashboard',
  PARTNERS: '/partners',
  REFERRALS: '/referrals',
  PARTNER_REFERRALS: '/partner/referrals',
  SETTLED_REFERRALS: '/settled-referrals',
  PARTNER_VALIDATE: '/partner/validate',
  DASHBOARD: '/dashboard',
  SERVER_STATUS: '/',  // Keep root endpoint for server status check
  RESET_PASSWORD: '/api/reset-password'
};

export default API_URL;
// Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import abbassLogo from './assets/Centre Logo.png';
import { API_CONFIG, setAuthToken, API_ENDPOINTS } from './config';

// Update axios instance configuration
const axiosInstance = axios.create(API_CONFIG);

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const Login = () => {
  const [credentials, setCredentials] = useState({ name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Add some debug logging
      console.log('Attempting login with credentials:', {
        ...credentials,
        password: '***'  // Don't log the actual password
      });

      // Use the unified login endpoint directly
      const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, credentials);
      console.log('Server response:', response.data);

      if (response.data.success) {
        setAuthToken(response.data.token);
        
        if (response.data.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (response.data.role === 'partner') {
          sessionStorage.setItem('partnerId', response.data.user._id);
          sessionStorage.setItem('partnerName', response.data.user.username);
          navigate('/partner/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // More specific error handling
      if (error.response?.status === 405) {
        setError('Server configuration error. Please contact support.');
      } else if (error.response?.status === 401) {
        setError('Invalid username or password.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Login failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <img src={abbassLogo} alt="Abbass Group" className="logo" />
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="name"
              value={credentials.name}
              onChange={handleChange}
              placeholder="Enter username"
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter password"
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={loading ? 'button-loading' : ''}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
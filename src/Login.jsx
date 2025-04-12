// Login.jsx
import React, { useState, useEffect } from 'react';
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
  const [serverStatus, setServerStatus] = useState('checking');
  const navigate = useNavigate();

  // Check server connectivity on component mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        console.log('Checking server status at:', `${API_CONFIG.baseURL}${API_ENDPOINTS.SERVER_STATUS}`);
        const response = await axios.get(`${API_CONFIG.baseURL}${API_ENDPOINTS.SERVER_STATUS}`);
        console.log('Server status response:', response);
        
        if (response.status === 200) {
          setServerStatus('online');
          console.log('Server is online');
        } else {
          setServerStatus('offline');
          setError('Server responded with unexpected status');
        }
      } catch (err) {
        console.error('Server connectivity check failed:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: `${API_CONFIG.baseURL}${API_ENDPOINTS.SERVER_STATUS}`
        });
        setServerStatus('offline');
        setError('Unable to connect to the server. Please try again later.');
      }
    };

    checkServerStatus();
  }, []);

  const handleChange = (e) => {
    setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with credentials:', {
        ...credentials,
        password: '***'
      });

      // Log the full URL being used for the login request
      const loginUrl = `${API_CONFIG.baseURL}${API_ENDPOINTS.LOGIN}`;
      console.log('Login request URL:', loginUrl);

      // Try using axios directly instead of the instance for login
      const response = await axios.post(loginUrl, credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
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
        status: error.response?.status,
        code: error.code,
        url: `${API_CONFIG.baseURL}${API_ENDPOINTS.LOGIN}`
      });
      
      if (error.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to the server. Please check your internet connection.');
      } else if (error.response?.status === 404) {
        setError('Server endpoint not found. Please contact support.');
      } else if (error.response?.status === 405) {
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
        {serverStatus === 'offline' && (
          <div className="error-message">
            Server is currently unavailable. Please try again later.
          </div>
        )}
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
              disabled={loading || serverStatus === 'offline'}
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
              disabled={loading || serverStatus === 'offline'}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || serverStatus === 'offline'}
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
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
  const [showForgotPasswordPopup, setShowForgotPasswordPopup] = useState(false);
  const navigate = useNavigate();

  // Check server connectivity on component mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        console.log('Checking server status at:', `${API_CONFIG.baseURL}${API_ENDPOINTS.SERVER_STATUS}`);
        
        // Try the root endpoint first, which returns a basic status message
        const response = await axios.get(`${API_CONFIG.baseURL}${API_ENDPOINTS.SERVER_STATUS}`, {
          timeout: 10000, // 10 second timeout
        });
        
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
        
        // Try a fallback endpoint if the first one fails
        try {
          console.log('Trying fallback endpoint /api/test');
          const fallbackResponse = await axios.get(`${API_CONFIG.baseURL}/api/test`, {
            timeout: 10000, // 10 second timeout
          });
          
          if (fallbackResponse.status === 200) {
            setServerStatus('online');
            console.log('Server is online (fallback check successful)');
          } else {
            setServerStatus('offline');
            setError('Server responded with unexpected status');
          }
        } catch (fallbackErr) {
          console.error('Fallback server check also failed:', fallbackErr.message);
          setServerStatus('offline');
          setError('Unable to connect to the server. Please try again later.');
        }
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

      // Use the axios instance for login
      const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, credentials);
      console.log('Server response:', response.data);

      if (response.data.role === 'admin') {
        setAuthToken(response.data.token);
        navigate('/admin/dashboard');
      } else if (response.data.role === 'partner') {
        setAuthToken(response.data.token);
        sessionStorage.setItem('partnerId', response.data.user._id);
        sessionStorage.setItem('partnerName', response.data.user.name);
        sessionStorage.setItem('partnerRole', 'partner');
        navigate('/partner/dashboard');
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

  const handleForgotPassword = () => {
    setShowForgotPasswordPopup(true);
  };

  const handleConfirmForgotPassword = () => {
    setShowForgotPasswordPopup(false);
    navigate('/forgot-password');
  };

  const handleBackToLogin = () => {
    navigate('/');
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
          {/* <div className="forgot-password">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="forgot-password-link"
            >
              Forgot Password?
            </button>
          </div> */}
        </form>
      </div>

      {showForgotPasswordPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Reset Password</h2>
            <p>Would you like to reset your password?</p>
            <div className="form-buttons">
              <button
                type="button"
                onClick={() => setShowForgotPasswordPopup(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmForgotPassword}
                className="confirm-btn"
              >
                Yes, Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
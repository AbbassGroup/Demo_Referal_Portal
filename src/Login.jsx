// Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import abbassLogo from './assets/Centre Logo.png';

const API_URL = process.env.REACT_APP_API_URL || 'https://abbass.group';

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
      const response = await axios.post(`${API_URL}/api/login`, credentials);
      console.log('Server response:', response.data);
      console.log("try")

      if (response.data.success) {
        // Store token in localStorage (shared across tabs)
        localStorage.setItem('token', response.data.token);
        
        if (response.data.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (response.data.role === 'partner') {
          // Store partner data in sessionStorage (unique to each tab)
          sessionStorage.setItem('partnerId', response.data.user._id);
          sessionStorage.setItem('partnerName', response.data.user.username);
          navigate('/partner/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
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
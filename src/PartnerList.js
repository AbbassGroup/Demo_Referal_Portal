import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Partners.css';
import { API_CONFIG, API_ENDPOINTS } from './config';

const PartnersList = () => {
  const [partners, setPartners] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newPartner, setNewPartner] = useState({
    firstname: '',
    lastname: '',
    company: '',
    email: '',
    number: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}${API_ENDPOINTS.PARTNERS}`);
      setPartners(response.data);
    } catch (error) {
      console.error('Error fetching partners:', error);
      setError('Failed to fetch partners');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPartner(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (newPartner.password !== newPartner.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const partnerData = { ...newPartner };
      delete partnerData.confirmPassword;
      
      const response = await axios.post(`${API_CONFIG.baseURL}${API_ENDPOINTS.PARTNERS}`, partnerData);
      
      if (response.data.success) {
        setSuccessMessage('Partner added successfully!');
        // Refresh the partners list
        await fetchPartners();
        
        // Reset form
        setNewPartner({
          firstname: '',
          lastname: '',
          company: '',
          email: '',
          number: '',
          name: '',
          password: '',
          confirmPassword: ''
        });

        setTimeout(() => {
          setShowPopup(false);
          setSuccessMessage('');
        }, 1500);
      }
    } catch (error) {
      console.error('Error adding partner:', error);
      setError(error.response?.data?.message || 'Failed to add partner');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (partnerId) => {
    try {
      await axios.delete(`${API_CONFIG.baseURL}${API_ENDPOINTS.PARTNERS}/${partnerId}`);
      await fetchPartners(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting partner:', error);
      setError('Failed to delete partner');
    }
  };

  return (
    <div className="partners-container">
      <div className="partners-header">
        <h1>Partners List</h1>
        <button
          className="add-partner-btn"
          onClick={() => setShowPopup(true)}
        >
          Add New Partner
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="partners-table-container">
        <table className="partners-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Username</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map(partner => (
              <tr key={partner._id}>
                <td>{partner.firstname} {partner.lastname}</td>
                <td>{partner.company}</td>
                <td>{partner.email}</td>
                <td>{partner.number}</td>
                <td>{partner.name}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(partner._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {partners.length === 0 && (
        <div className="no-partners">No partners found</div>
      )}

      {/* Add Partner Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Add New Partner</h2>
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-sections">
                {/* Personal Information Section */}
                <div className="form-section">
                  <h3>Personal Information</h3>
                  <div className="form-group">
                    <label>First Name:</label>
                    <input
                      type="text"
                      name="firstname"
                      value={newPartner.firstname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name:</label>
                    <input
                      type="text"
                      name="lastname"
                      value={newPartner.lastname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Company:</label>
                    <input
                      type="text"
                      name="company"
                      value={newPartner.company}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="form-section">
                  <h3>Contact Information</h3>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={newPartner.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number:</label>
                    <input
                      type="tel"
                      name="number"
                      value={newPartner.number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Account Information Section */}
                <div className="form-section">
                  <h3>Account Setup</h3>
                  <div className="form-group">
                    <label>Username:</label>
                    <input
                      type="text"
                      name="name"
                      value={newPartner.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password:</label>
                    <input
                      type="password"
                      name="password"
                      value={newPartner.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password:</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={newPartner.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="popup-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnersList;
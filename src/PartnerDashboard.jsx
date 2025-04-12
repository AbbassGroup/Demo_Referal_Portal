// PartnerDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './PartnerDashboard.css'; // Update the CSS import
import { useNavigate } from 'react-router-dom';
import { REFERRAL_STAGES, STAGE_COLORS } from "./constant.js";
import Logo from "./assets/Top Left Logo.png";
import { API_CONFIG, API_ENDPOINTS } from './config';

const ReferralCard = ({ referral }) => (
  <div className="referral-card view-only">
    <div className="referral-card-header">
      <h4>
        {referral.firstName
          ? `${referral.firstName} ${referral.surname}`
          : referral.name}
      </h4>
      <span className="referral-date">
        {new Date(referral.date).toLocaleDateString()}
      </span>
    </div>
    <div className="referral-card-content">
      <p><strong>Email:</strong> {referral.email}</p>
      <p><strong>Phone:</strong> {referral.contactNumber}</p>
      <p><strong>Business Unit:</strong> {referral.businessUnit}</p>
      <p><strong>Preferred Time:</strong> {referral.preferredContactTime}</p>
      
      {/* Display commission if it exists and is greater than 0 */}
      {referral.commission > 0 && (
        <p className="commission-value">
          <strong>Commission:</strong> ${referral.commission.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </p>
      )}
    </div>
  </div>
);

const Column = ({ title, referrals }) => (
  <div className="board-column" style={{ borderTopColor: STAGE_COLORS[title] }}>
    <h3 className="column-title">
      {title}
      <span className="count">{referrals.length}</span>
    </h3>
    <div className="referral-list view-only">
      {referrals.map((referral) => (
        <ReferralCard
          key={referral._id}
          referral={referral}
        />
      ))}
    </div>
  </div>
);

const PartnerDashboard = () => {
  const [referrals, setReferrals] = useState({});
  const [settledReferrals, setSettledReferrals] = useState([]);
  const [hiddenReferrals, setHiddenReferrals] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [partner, setPartner] = useState(null);
  const [newReferral, setNewReferral] = useState({
    firstName: '',
    surname: '',
    contactNumber: '',
    email: '',
    preferredContactTime: '',
    businessUnit: 'Advocacy'
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('active'); // 'active' or 'settled'
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  const validatePartnerSession = useCallback(async () => {
    const currentPartnerId = sessionStorage.getItem('partnerId');
    const currentToken = localStorage.getItem('token');
    
    if (!currentPartnerId || !currentToken) {
      console.log('No valid session found');
      navigate('/login');
      return false;
    }

    try {
      const validationResponse = await axios.get(`${API_CONFIG.baseURL}${API_ENDPOINTS.PARTNER_VALIDATE}`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        params: { partnerId: currentPartnerId }
      });
      
      if (validationResponse.data.partnerId !== currentPartnerId) {
        console.log('Session mismatch detected');
        sessionStorage.clear();
        navigate('/login');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      sessionStorage.clear();
      navigate('/login');
      return false;
    }
  }, [navigate]);

  const fetchReferrals = useCallback(async () => {
    try {
      const partnerId = sessionStorage.getItem('partnerId');
      const token = localStorage.getItem('token');
      
      if (!partnerId || !token) {
        console.error('No partnerId or token found');
        setError('Please log in again.');
        navigate('/login');
        return;
      }

      console.log('Fetching referrals for partner:', partnerId);

      const response = await axios.get(`${API_CONFIG.baseURL}${API_ENDPOINTS.PARTNER_REFERRALS}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { partnerId }
      });

      console.log('Received referrals response:', response.data);

      // Check if response.data.data exists (where the referrals array is)
      const referralsArray = response.data.data || [];

      // Initialize all stages with empty arrays
      const organizedReferrals = Object.values(REFERRAL_STAGES).reduce(
        (acc, stage) => {
          acc[stage] = [];
          return acc;
        },
        {}
      );

      // Add a special mapping for "Revenue" to "Commission Paid"
      const stageMapping = {
        "Revenue": "Commission Paid"
      };

      // Distribute referrals to their respective stages
      referralsArray.forEach((referral) => {
        let mappedStatus = referral.status;
        if (stageMapping[mappedStatus]) {
          mappedStatus = stageMapping[mappedStatus];
        }

        const stage =
          mappedStatus && organizedReferrals.hasOwnProperty(mappedStatus)
            ? mappedStatus
            : Object.values(REFERRAL_STAGES)[0];

        organizedReferrals[stage].push(referral);
      });

      console.log('Organized referrals:', organizedReferrals);
      setReferrals(organizedReferrals);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/login');
      } else {
        setError('Failed to fetch referrals. Please try again.');
      }
      setLoading(false);
    }
  }, [navigate]);

  const fetchSettledReferrals = useCallback(async () => {
    try {
      const partnerId = sessionStorage.getItem('partnerId');
      const token = localStorage.getItem('token');
      
      if (!partnerId || !token) {
        console.error('No partnerId or token found. User may not be logged in.');
        return;
      }

      console.log('Fetching settled referrals for partnerId:', partnerId);
      
      const response = await axios.get(`${API_CONFIG.baseURL}${API_ENDPOINTS.SETTLED_REFERRALS}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { partnerId }
      });
      
      console.log('Received settled referrals:', response.data);
      
      // Filter referrals to ensure they belong to the current partner
      const filteredReferrals = response.data.filter(
        referral => referral.assignedPartner && referral.assignedPartner._id === partnerId
      );
      
      // Filter out hidden referrals
      const visibleReferrals = filteredReferrals.filter(
        referral => !hiddenReferrals.includes(referral._id)
      );
      
      console.log('Filtered settled referrals:', visibleReferrals);
      
      setSettledReferrals(visibleReferrals);
    } catch (error) {
      console.error('Error fetching settled referrals:', error);
    }
  }, [hiddenReferrals]);

  const fetchPartnerData = useCallback(async () => {
    try {
      const partnerId = sessionStorage.getItem('partnerId');
      const token = localStorage.getItem('token');
      
      if (!partnerId || !token) {
        console.error('No partnerId or token found');
        navigate('/login');
        return;
      }

      console.log('Fetching partner data for ID:', partnerId);
      const response = await axios.get(`${API_CONFIG.baseURL}/api/partners/${partnerId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Raw partner data received:', response.data);
      // Check if the data is nested in a 'data' property
      const partnerData = response.data.data || response.data;
      console.log('Processed partner data:', partnerData);
      
      setPartner(partnerData);
      
    } catch (error) {
      console.error('Error fetching partner data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const isValid = await validatePartnerSession();
        if (isValid) {
          await fetchPartnerData();
          await fetchReferrals();
          fetchSettledReferrals();
        }
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        setError('Failed to initialize dashboard');
      }
    };

    initializeDashboard();
    const interval = setInterval(fetchReferrals, 30000);
    return () => clearInterval(interval);
  }, [fetchReferrals, fetchSettledReferrals, validatePartnerSession, fetchPartnerData]);

  // Load hidden referrals from localStorage on component mount
  useEffect(() => {
    const savedHiddenReferrals = localStorage.getItem('hiddenReferrals');
    if (savedHiddenReferrals) {
      setHiddenReferrals(JSON.parse(savedHiddenReferrals));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReferral(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    try {
      const partnerId = sessionStorage.getItem('partnerId');
      const token = localStorage.getItem('token');
      
      if (!partnerId || !token) {
        setError('No valid partner session found. Please log in again.');
        return;
      }

      const referralData = {
        ...newReferral,
        assignedPartner: partnerId
      };

      // Removed the unused response variable
      await axios.post(`${API_CONFIG.baseURL}/api/referrals`, referralData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('Referral added successfully!');
      setNewReferral({
        firstName: '',
        surname: '',
        contactNumber: '',
        email: '',
        preferredContactTime: '',
        businessUnit: 'Advocacy'
      });
      setShowPopup(false);
      fetchReferrals();
    } catch (error) {
      console.error('Error adding referral:', error);
      setError(error.response?.data?.message || 'Error adding referral. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('token');
      setReferrals({});
      setSettledReferrals([]);
      setError(null);
      setSuccessMessage(null);
      setShowPopup(false);
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/');
    }
  };

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const handleDeleteClick = (referral) => {
    setDeleteConfirm(referral);
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    
    // Add the referral ID to the hidden referrals list
    const updatedHiddenReferrals = [...hiddenReferrals, deleteConfirm._id];
    setHiddenReferrals(updatedHiddenReferrals);
    
    // Save to localStorage
    localStorage.setItem('hiddenReferrals', JSON.stringify(updatedHiddenReferrals));
    
    // Update the settled referrals list
    setSettledReferrals(settledReferrals.filter(ref => ref._id !== deleteConfirm._id));
    
    // Close the confirmation dialog
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading referrals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchReferrals} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="partner-dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img src={Logo} alt="Abbass Group Logo" className="sidebar-logo" />
          </div>
          <h2>Partner Portal</h2>
          {partner && (
            <div className="partner-profile">
              <div className="profile-icon">
                <span>
                  {(partner.username || partner.name || 'P')[0].toUpperCase()}
                </span>
              </div>
              <div className="profile-info">
                <div className="profile-name">
                  {partner.username || partner.name || 'Partner'}
                </div>
                <div className="profile-role">Partner</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar Navigation */}
        <div className="sidebar-navigation">
          <div 
            className={`nav-item ${activeView === 'active' ? 'active' : ''}`}
            onClick={() => handleViewChange('active')}
          >
            <span className="nav-text">Active Referrals</span>
          </div>
          <div 
            className={`nav-item ${activeView === 'settled' ? 'active' : ''}`}
            onClick={() => handleViewChange('settled')}
          >
            <span className="nav-text">Settled Referrals</span>
          </div>
        </div>
        
        {/* Logout Button */}
        <div className="sidebar-logout">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="partner-dashboard-header">
          <h2>{activeView === 'active' ? 'Partner Dashboard' : 'My Settled Referrals'}</h2>
          <div className="header-buttons">
            <button className="refresh-btn" onClick={() => {
              fetchReferrals();
              fetchSettledReferrals();
            }}>
              <span className="refresh-icon">🔄</span>
              Refresh
            </button>
            {activeView === 'active' && (
              <>
                <button className="add-referral-btn" onClick={() => setShowPopup(true)}>
                  Add New Referral
                </button>
                <button className="refresh-active-btn" onClick={() => fetchReferrals()}>
                  <span className="refresh-icon">🔄</span>
                  Refresh Active
                </button>
              </>
            )}
            {activeView === 'settled' && (
              <button className="refresh-settled-btn" onClick={() => fetchSettledReferrals()}>
                <span className="refresh-icon">🔄</span>
                Refresh Settled
              </button>
            )}
          </div>
        </div>

        {/* Active Referrals View */}
        {activeView === 'active' && (
          <div className="board-columns">
            {Object.values(REFERRAL_STAGES).map((stage) => (
              <Column
                key={stage}
                title={stage}
                referrals={referrals[stage] || []}
              />
            ))}
          </div>
        )}

        {/* Settled Referrals View */}
        {activeView === 'settled' && (
          <div className="settled-referrals-section">
            <div className="settled-referrals-list">
              {settledReferrals.length > 0 ? (
                settledReferrals.map((referral) => (
                  <div key={referral._id} className="settled-referral-card">
                    <div className="settled-referral-header">
                      <h3>
                        {referral.firstName} {referral.surname}
                      </h3>
                      <div className="settled-referral-actions">
                        <span className="settled-date">
                          Settled: {new Date(referral.settledDate).toLocaleDateString()}
                        </span>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteClick(referral)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="settled-referral-content">
                      <p><strong>Email:</strong> {referral.email}</p>
                      <p><strong>Phone:</strong> {referral.contactNumber}</p>
                      <p><strong>Business Unit:</strong> {referral.businessUnit}</p>
                      {referral.preferredContactTime && (
                        <p><strong>Preferred Contact Time:</strong> {referral.preferredContactTime}</p>
                      )}
                      {referral.commission > 0 && (
                        <p className="commission-value">
                          <strong>Commission:</strong> ${referral.commission.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      )}
                      <p className="original-date">
                        <strong>Original Date:</strong> {new Date(referral.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-settled-referrals">
                  <p>You don't have any settled referrals yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Popup */}
        {deleteConfirm && (
          <div className="delete-confirmation-popup">
            <div className="delete-confirmation-content">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to remove this referral from your view?</p>
              <p><strong>{deleteConfirm.firstName} {deleteConfirm.surname}</strong></p>
              <div className="delete-confirmation-actions">
                <button 
                  className="cancel-btn"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-delete-btn"
                  onClick={handleConfirmDelete}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>Add New Referral</h2>
              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              <form onSubmit={handleSubmitReferral}>
                <div className="form-group">
                  <label>First Name:</label>
                  <input
                    type="text"
                    name="firstName"
                    value={newReferral.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Surname:</label>
                  <input
                    type="text"
                    name="surname"
                    value={newReferral.surname}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number:</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={newReferral.contactNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={newReferral.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Preferred Contact Time:</label>
                  <input
                    type="text"
                    name="preferredContactTime"
                    value={newReferral.preferredContactTime}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Business Unit:</label>
                  <select
                    name="businessUnit"
                    value={newReferral.businessUnit}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Advocacy">Advocacy</option>
                    <option value="Business Brokers">Business Brokers</option>
                    <option value="Global Properties">Global Properties</option>
                  </select>
                </div>
                <div className="form-buttons">
                  <button type="submit">Add Referral</button>
                  <button type="button" onClick={() => setShowPopup(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerDashboard;
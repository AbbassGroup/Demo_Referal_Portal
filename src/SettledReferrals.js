import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SettledReferrals.css";
import API_URL from './config';

//const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const SettledReferrals = () => {
  const [settledReferrals, setSettledReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchSettledReferrals();
  }, []);

  const fetchSettledReferrals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/settled-referrals`);
      setSettledReferrals(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching settled referrals:", err);
      setError("Failed to load settled referrals");
      setLoading(false);
    }
  };

  const handleDeleteClick = (referral) => {
    setDeleteConfirm(referral);
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      setDeleteLoading(true);
      await axios.delete(`${API_URL}/settled-referrals/${deleteConfirm._id}`);
      setSettledReferrals(settledReferrals.filter(ref => ref._id !== deleteConfirm._id));
      setDeleteConfirm(null);
      setDeleteLoading(false);
    } catch (err) {
      console.error("Error deleting settled referral:", err);
      setError("Failed to delete referral");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading settled referrals...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="settled-referrals-container">
      <h2>Settled Referrals</h2>
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
                {referral.assignedPartner && (
                  <p className="partner-info">
                    <strong>Partner:</strong> {`${referral.assignedPartner.firstname} ${referral.assignedPartner.lastname}`}
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
            <p>No settled referrals found.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirm && (
        <div className="delete-confirmation-popup">
          <div className="delete-confirmation-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this referral?</p>
            <p><strong>{deleteConfirm.firstName} {deleteConfirm.surname}</strong></p>
            <div className="delete-confirmation-actions">
              <button 
                className="cancel-btn"
                onClick={handleCancelDelete}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettledReferrals; 
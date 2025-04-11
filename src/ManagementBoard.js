import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import { REFERRAL_STAGES, STAGE_COLORS } from "./constant.js";
import "./ManagementBoard.css";
import API_URL from './config';
//const API_URL = "http://localhost:5001";

const ReferralCard = ({ referral, index, onEdit, onSettle, status }) => (
  <Draggable draggableId={referral._id.toString()} index={index}>
    {(provided, snapshot) => (
      <div
        className={`referral-card ${snapshot.isDragging ? 'dragging' : ''}`}
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <div className="referral-card-header">
          <h4>
            {/* Use firstName + surname if they exist; fallback to old "name" field if needed */}
            {referral.firstName
              ? `${referral.firstName} ${referral.surname}`
              : referral.name}
          </h4>
          <div className="card-actions">
            <button className="edit-btn" onClick={() => onEdit(referral)}>
              ✏️
            </button>
            {(status === "Commission Paid" || status === "Revenue") && (
              <button className="settle-btn" onClick={() => onSettle(referral)}>
                ✓
              </button>
            )}
            <span className="referral-date">
              {new Date(referral.date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="referral-card-content">
          {/* Display Email */}
          <p><strong>Email:</strong> {referral.email}</p>
  
          {/* Display Phone Number (stored as "contactNumber" in your new schema) */}
          <p><strong>Phone:</strong> {referral.contactNumber}</p>
  
          {/* Display Business Unit */}
          <p><strong>Business Unit:</strong> {referral.businessUnit}</p>
  
          {/* Remove Status line: no longer displayed */}
          {/* <p><strong>Status:</strong> {referral.status}</p> */}

          {/* Format commission with currency and only show if greater than 0 */}
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
              {referral.assignedPartner.company && (
                <span className="partner-company"> ({referral.assignedPartner.company})</span>
              )}
            </p>
          )}
        </div>
      </div>
    )}
  </Draggable>
);

const Column = ({ title, referrals, onEdit, onSettle }) => (
  <div className="board-column" style={{ borderTopColor: STAGE_COLORS[title] }}>
    <h3 className="column-title">
      {title}
      <span className="count">{referrals.length}</span>
    </h3>
    <Droppable droppableId={title}>
      {(provided, snapshot) => (
        <div
          className={`referral-list ${
            snapshot.isDraggingOver ? "dragging-over" : ""
          }`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          {referrals.map((referral, index) => (
            <ReferralCard
              key={referral._id}
              referral={referral}
              index={index}
              onEdit={onEdit}
              onSettle={onSettle}
              status={title}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

const EditReferralPopup = ({ referral, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: referral.firstName || '',
    surname: referral.surname || '',
    contactNumber: referral.contactNumber || '',
    email: referral.email || '',
    preferredContactTime: referral.preferredContactTime || '',
    businessUnit: referral.businessUnit || '',
    commission: referral.commission || 0,
    status: referral.status || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'commission') {
      // Ensure commission is treated as a number and not negative
      const numValue = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : Math.max(0, numValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First try with PATCH
      let response;
      try {
        response = await fetch(`${API_URL}/referrals/${referral._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            commission: parseFloat(formData.commission) // Ensure commission is sent as a number
          }),
        });
      } catch (patchError) {
        console.log("PATCH failed, trying PUT instead");
        // If PATCH fails, try PUT
        response = await fetch(`${API_URL}/referrals/${referral._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            commission: parseFloat(formData.commission) // Ensure commission is sent as a number
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to update referral');
      }

      const updatedReferral = await response.json();
      onSave(updatedReferral);
      onClose();
    } catch (err) {
      setError('Failed to update referral. Please try again.');
      console.error('Error updating referral:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Edit Referral</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Surname:</label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Contact Number:</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Preferred Contact Time:</label>
            <input
              type="text"
              name="preferredContactTime"
              value={formData.preferredContactTime}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Business Unit:</label>
            <input
              type="text"
              name="businessUnit"
              value={formData.businessUnit}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Commission ($):</label>
            <input
              type="number"
              name="commission"
              value={formData.commission}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>Status:</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="New lead">New lead</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
          <div className="form-buttons">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManagementBoard = () => {
  const [referrals, setReferrals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingReferral, setEditingReferral] = useState(null);
  const [settleConfirm, setSettleConfirm] = useState(null);
  const [settleLoading, setSettleLoading] = useState(false);

  const fetchReferrals = async () => {
    try {
      console.log("Fetching referrals...");
      const response = await axios.get(`${API_URL}/referrals`);
      console.log("Received referrals:", response.data);

      // Initialize all stages with empty arrays
      const organizedReferrals = Object.values(REFERRAL_STAGES).reduce(
        (acc, stage) => {
          acc[stage] = [];
          return acc;
        },
        {}
      );

      // Add a special mapping for "Revenue" to "Commission Paid" during transition
      const stageMapping = {
        "Revenue": "Commission Paid"
      };

      // Distribute referrals to their respective stages
      response.data.forEach((referral) => {
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

      console.log("Organized referrals:", organizedReferrals);
      setReferrals(organizedReferrals);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error fetching referrals:", err);
      setError(`Failed to fetch referrals: ${err.message}`);
      setLoading(false);
    }
  };

  // Fetch referrals initially and set up polling
  useEffect(() => {
    fetchReferrals();
    const interval = setInterval(fetchReferrals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    try {
      // Update frontend state first for immediate feedback
      const newReferrals = { ...referrals };
      const sourceList = [...newReferrals[source.droppableId]];
      const destList = [...newReferrals[destination.droppableId]];

      const [movedReferral] = sourceList.splice(source.index, 1);
      movedReferral.status = destination.droppableId;
      destList.splice(destination.index, 0, movedReferral);

      newReferrals[source.droppableId] = sourceList;
      newReferrals[destination.droppableId] = destList;

      setReferrals(newReferrals);

      // Update backend
      console.log("Updating referral status:", {
        id: draggableId,
        newStatus: destination.droppableId,
      });

      // First try with PATCH
      try {
        await axios.patch(`${API_URL}/referrals/${draggableId}/status`, {
          status: destination.droppableId,
        });
      } catch (patchError) {
        console.log("PATCH failed, trying PUT instead");
        // If PATCH fails, try PUT
        await axios.put(`${API_URL}/referrals/${draggableId}/status`, {
          status: destination.droppableId,
        });
      }

      // Fetch updated data
      fetchReferrals();
    } catch (err) {
      console.error("Failed to update referral status:", err);
      fetchReferrals(); // Revert to original state if there's an error
    }
  };

  const handleEditReferral = (referral) => {
    setEditingReferral(referral);
  };

  const handleSaveEdit = async (updatedReferral) => {
    try {
      // First try with PATCH
      try {
        await axios.patch(`${API_URL}/referrals/${updatedReferral._id}`, updatedReferral);
      } catch (patchError) {
        console.log("PATCH failed, trying PUT instead");
        // If PATCH fails, try PUT
        await axios.put(`${API_URL}/referrals/${updatedReferral._id}`, updatedReferral);
      }
      await fetchReferrals();
    } catch (error) {
      console.error("Error saving referral:", error);
      setError("Failed to save referral changes");
    }
  };

  const handleSettleReferral = (referral) => {
    setSettleConfirm(referral);
  };

  const confirmSettleReferral = async () => {
    if (!settleConfirm) return;
    
    setSettleLoading(true);
    try {
      // First try with POST
      let response;
      try {
        response = await axios.post(`${API_URL}/referrals/${settleConfirm._id}/settle`);
      } catch (postError) {
        console.log("POST failed, trying PUT instead");
        // If POST fails, try PUT
        response = await axios.put(`${API_URL}/referrals/${settleConfirm._id}/settle`);
      }
      
      if (response.data.success) {
        // Remove the settled referral from the state
        const updatedReferrals = { ...referrals };
        if (updatedReferrals["Commission Paid"]) {
          updatedReferrals["Commission Paid"] = updatedReferrals["Commission Paid"].filter(
            ref => ref._id !== settleConfirm._id
          );
        }
        setReferrals(updatedReferrals);
        setSettleConfirm(null);
      }
    } catch (err) {
      console.error('Error settling referral:', err);
      setError('Failed to settle referral. Please try again.');
    } finally {
      setSettleLoading(false);
    }
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
    <div className="management-board">
      <div className="board-header">
        <h2>Referral Management Board</h2>
        <button onClick={fetchReferrals} className="refresh-btn">
          <span className="refresh-icon">↻</span>
          Refresh
        </button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-columns">
          {Object.values(REFERRAL_STAGES).map((stage) => (
            <Column
              key={stage}
              title={stage}
              referrals={referrals[stage] || []}
              onEdit={handleEditReferral}
              onSettle={handleSettleReferral}
            />
          ))}
        </div>
      </DragDropContext>

      {editingReferral && (
        <EditReferralPopup
          referral={editingReferral}
          onClose={() => setEditingReferral(null)}
          onSave={handleSaveEdit}
        />
      )}

      {settleConfirm && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Confirm Settlement</h2>
            <p>Are you sure you want to mark this referral as settled?</p>
            <p><strong>Name:</strong> {settleConfirm.firstName} {settleConfirm.surname}</p>
            <p><strong>Commission:</strong> ${settleConfirm.commission.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</p>
            <div className="form-buttons">
              <button 
                type="button" 
                onClick={() => setSettleConfirm(null)}
                disabled={settleLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={confirmSettleReferral}
                disabled={settleLoading}
                className="confirm-btn"
              >
                {settleLoading ? 'Processing...' : 'Confirm Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementBoard;
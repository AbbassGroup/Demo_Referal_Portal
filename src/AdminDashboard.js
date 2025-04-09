import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDashboard.css";
import PartnersList from "./PartnerList";
import ManagementBoard from "./ManagementBoard.js";
import SettledReferrals from "./SettledReferrals";
import Logo from "./assets/Top Left Logo.png";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    totalPartners: 0,
    referralStats: {
      new: 0,
      contacted: 0,
      pending: 0,
      converted: 0,
    },
    recentReferrals: [],
  });

  // State for admin data
  const [admin, setAdmin] = useState([]);

  // Fetch admin data
  useEffect(() => {
    axios
      .get(`${API_URL}/getAdmin`)
      .then((response) => {
        console.log("Admin data:", response.data);
        setAdmin(response.data);
      })
      .catch((err) => {
        console.error("Error fetching admin:", err);
      });
  }, []);

  // Fetch dashboard data including partners count
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const partnersResponse = await axios.get(`${API_URL}/api/partners`);
        const totalPartners = partnersResponse.data.length;
        
        // Get referrals with populated partner details
        const referralsResponse = await axios.get(`${API_URL}/api/referrals`);
        const referrals = referralsResponse.data;

        const referralStats = {
          new: referrals.filter((ref) => ref.status === "New lead").length,
          contacted: referrals.filter((ref) => ref.status === "Client engaged").length,
          pending: referrals.filter((ref) => ref.status === "Settled").length,
          converted: referrals.filter((ref) => 
            ref.status === "Commission Paid" || ref.status === "Revenue"
          ).length,
        };

        // Get recent referrals with populated partner data
        const recentReferralsResponse = await axios.get(`${API_URL}/api/referrals?populate=assignedPartner`);
        const recentReferrals = recentReferralsResponse.data
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        setDashboardData({
          totalPartners,
          referralStats,
          recentReferrals,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/");
  };

  const renderDashboardContent = () => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    return (
      <div className="dashboard-content">
        <div className="dashboard-stats">
          <div className="dashboard-card total-partners">
            <h2>Total Partners</h2>
            <div className="card-value">{dashboardData.totalPartners}</div>
          </div>
        </div>

        <div className="referral-status">
          <h2>Referral Status</h2>
          <div className="status-grid">
            <div className="status-card">
              <h3>New</h3>
              <div className="status-value new">{dashboardData.referralStats.new}</div>
            </div>
            <div className="status-card">
              <h3>Client Engaged</h3>
              <div className="status-value contacted">{dashboardData.referralStats.contacted}</div>
            </div>
            <div className="status-card">
              <h3>Settled</h3>
              <div className="status-value pending">{dashboardData.referralStats.pending}</div>
            </div>
            <div className="status-card">
              <h3>Commission Paid</h3>
              <div className="status-value converted">{dashboardData.referralStats.converted}</div>
            </div>
          </div>
        </div>

        <div className="recent-referrals">
          <h2>Recent Referrals</h2>
          <div className="referrals-list">
            {dashboardData.recentReferrals.length > 0 ? (
              dashboardData.recentReferrals.map((referral, index) => (
                <div key={index} className="referral-item">
                  <div className="referral-row">
                    <span className="field-label">Name:</span>
                    <span className="field-value">
                      {referral.firstName ? `${referral.firstName} ${referral.surname}` : referral.name}
                    </span>
                  </div>
                  <div className="referral-info-grid">
                    <div className="referral-row">
                      <span className="field-label">Email:</span>
                      <span className="field-value">{referral.email}</span>
                    </div>
                    <div className="referral-row">
                      <span className="field-label">Phone:</span>
                      <span className="field-value">{referral.contactNumber || 'N/A'}</span>
                    </div>
                    <div className="referral-row">
                      <span className="field-label">Partner:</span>
                      <span className="field-value">
                        {referral.assignedPartner ? 
                          `${referral.assignedPartner.firstname} ${referral.assignedPartner.lastname}` : 
                          'N/A'}
                      </span>
                    </div>
                    <div className="referral-row">
                      <span className="field-label">Date:</span>
                      <span className="field-value">
                        {new Date(referral.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="referral-row">
                    <span className="field-label">Status:</span>
                    <span className={`field-value status-${referral.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {referral.status === "Revenue" ? "Commission Paid" : referral.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-referrals">No recent referrals</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img src={Logo} alt="Abbass Group Logo" className="sidebar-logo" />
          </div>
          <h2>Admin Portal</h2>
          <div className="admin-profile">
            <div className="profile-icon">
              <span>{admin[0]?.name?.charAt(0).toUpperCase() || "A"}</span>
            </div>
            <div className="profile-info">
              <div className="profile-name">{admin.map((admin) => admin.name)}</div>
              <div className="profile-role">Administrator</div>
            </div>
          </div>
        </div>

        <div className="sidebar-menu">
          <div
            className={`sidebar-item ${activeSection === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveSection("dashboard")}
          >
            <span>Dashboard</span>
          </div>
          <div
            className={`sidebar-item ${activeSection === "partners" ? "active" : ""}`}
            onClick={() => setActiveSection("partners")}
          >
            <span>List of Partners</span>
          </div>
          <div
            className={`sidebar-item ${activeSection === "referrals" ? "active" : ""}`}
            onClick={() => setActiveSection("referrals")}
          >
            <span>Referral Board</span>
          </div>
          <div
            className={`sidebar-item ${activeSection === "settled" ? "active" : ""}`}
            onClick={() => setActiveSection("settled")}
          >
            <span>Settled Referral</span>
          </div>
          <div className="sidebar-item signout" onClick={handleSignOut}>
            <span>Sign Out</span>
          </div>
        </div>
      </div>

      <main className="dashboard-main">
        {activeSection === "dashboard" && renderDashboardContent()}
        {activeSection === "partners" && <PartnersList />}
        {activeSection === "referrals" && <ManagementBoard />}
        {activeSection === "settled" && <SettledReferrals />}
      </main>
    </div>
  );
};

export default AdminDashboard;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import PartnerDashboard from './PartnerDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} /> {/* Add this line */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/partner/dashboard" element={<PartnerDashboard />} />
        
        {/* Optional: Add a catch-all route for any undefined routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
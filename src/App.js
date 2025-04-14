// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import PartnerDashboard from './PartnerDashboard';
import ForgotPassword from './ForgotPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/partner/dashboard" element={<PartnerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
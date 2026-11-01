import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home     from './pages/Home';
import Login    from './pages/Login';
import Register from './pages/Register';

import PatientDashboard from './pages/patient/Dashboard';
import MedecinDashboard from './pages/medecin/Dashboard';
import AdminDashboard   from './pages/admin/Dashboard';

import PrivateRoute from './components/PrivateRoute';
import { useAuth }  from './context/AuthContext';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <div style={{ color: '#546E7A', fontSize: '0.9rem' }}>Chargement…</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Pages publiques */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Patient */}
        <Route element={<PrivateRoute role="patient" />}>
          <Route path="/patient/*" element={<PatientDashboard />} />
        </Route>

        {/* Dashboard Médecin */}
        <Route element={<PrivateRoute role="medecin" />}>
          <Route path="/medecin/*" element={<MedecinDashboard />} />
        </Route>

        {/* Dashboard Admin */}
        <Route element={<PrivateRoute role="admin" />}>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

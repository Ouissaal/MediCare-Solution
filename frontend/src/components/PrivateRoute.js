import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Non connecté → Login
  if (!user) return <Navigate to="/login" replace />;

  // Mauvais rôle → page d'accueil
  // conditions imbriquée 
  if (role && user.role !== role) {
    if (user.role === 'patient') return <Navigate to="/patient" replace />;
    if (user.role === 'medecin') return <Navigate to="/medecin" replace />;
    if (user.role === 'admin')   return <Navigate to="/admin"   replace />;
    return <Navigate to="/" replace />;
}

  return <Outlet />;
}

// explication 
/*
If the user is not allowed → redirect (<Navigate />)
If the user is allowed → show the requested page

That’s where <Outlet /> is used.
*/
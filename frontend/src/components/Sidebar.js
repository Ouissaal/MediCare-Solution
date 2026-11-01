import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ links }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initiale = user?.nom ? user.nom.charAt(0).toUpperCase() : '?';

  const roleLabel = {
    patient: 'Patient',
    medecin: 'Médecin',
    admin:   'Administrateur',
  }[user?.role] || user?.role;

  return (
    <aside className="mc-sidebar">
      {/* Logo */}
      <div className="mc-sidebar-brand">
        <span className="brand-name">
          <img src="/logo.png" alt="MediCare logo" style={{ width: 32, height: 32, objectFit: 'contain', marginRight: '0.5rem' }} />
          MediCare
        </span>
        <span className="brand-sub">Solutions</span>
      </div>

      {/* Utilisateur connecté */}
      <div className="mc-sidebar-user">
        <div className="avatar">{initiale}</div>
        <div>
          <div className="u-name">{user?.nom}</div>
          <div className="u-role">{roleLabel}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mc-sidebar-nav">
        <div className="mc-nav-section">Navigation</div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `mc-nav-link${isActive ? ' active' : ''}`}
          >
            <i className={`bi ${link.icon}`} />
            {link.label}
          </NavLink>
        ))}

      </nav>

      {/* Déconnexion */}
      <div className="mc-sidebar-footer">
        <button className="mc-logout-btn" onClick={handleLogout}>
          <i className="bi bi-box-arrow-left" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}

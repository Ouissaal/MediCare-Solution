import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Si déjà connecté, redirige vers son dashboard
  const goDashboard = () => {
    if (!user) return;
    if (user.role === 'patient') navigate('/patient');
    if (user.role === 'medecin') navigate('/medecin');
    if (user.role === 'admin')   navigate('/admin');
  };

  return (
    <div className="mc-hero">
      {/* Vidéo de fond */}
      <video
        autoPlay muted loop playsInline
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0,
        }}
      >
        <source src="/bg_video.mp4" type="video/mp4" />
      </video>
      {/* Overlay sombre pour lisibilité */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(16,42,63,0.82) 0%, rgba(78,141,156,0.6) 60%, rgba(133,199,154,0.45) 100%)',
        zIndex: 1,
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.1rem 2.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src="/logo.png" alt="MediCare Logo" style={{ height: '2.2rem', width: 'auto' }} />
          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>
            MediCare <span style={{ fontWeight: 400, opacity: 0.8 }}>Solutions</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {user ? (
            <button className="mc-btn" onClick={goDashboard}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', padding: '0.5rem 1.25rem' }}>
              <i className="bi bi-grid-fill me-2" />
              Mon tableau de bord
            </button>
          ) : (
            <>
              <button className="mc-btn" onClick={() => navigate('/login')}
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', padding: '0.5rem 1.25rem' }}>
                Se connecter
              </button>
              <button className="mc-btn" onClick={() => navigate('/register')}
                style={{ background: 'white', color: '#102a3f', border: 'none', borderRadius: '10px', padding: '0.5rem 1.25rem', fontWeight: 700 }}>
                S'inscrire
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero principal */}
      <div className="mc-hero-inner container-fluid px-5">
        <div className="row align-items-center w-100">

          {/* Texte gauche */}
          <div className="col-lg-6 mc-hero-content">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.15)', borderRadius: '30px',
              padding: '0.35rem 1rem', marginBottom: '1.5rem',
              fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <i className="bi bi-shield-check-fill" style={{ color: '#85C79A' }} />
              Système de gestion hospitalière sécurisé
            </div>

            <h1>
              Votre santé,<br />
              <span style={{ color: '#85C79A' }}>notre priorité</span>
            </h1>

            <p className="lead mt-3 mb-4">
              Prenez rendez-vous avec vos médecins facilement, gérez vos consultations
              et suivez votre dossier médical en toute sécurité.
            </p>

            {user ? (
              <button className="mc-btn" onClick={goDashboard}
                style={{ background: 'white', color: '#102a3f', border: 'none', borderRadius: '12px', padding: '0.85rem 2rem', fontWeight: 700, fontSize: '1rem' }}>
                <i className="bi bi-grid-fill me-2" />
                Accéder à mon espace
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/register')}
                  className="mc-btn"
                  style={{ background: 'white', color: '#102a3f', border: 'none', borderRadius: '12px', padding: '0.85rem 2rem', fontWeight: 700, fontSize: '1rem' }}>
                  <i className="bi bi-person-plus-fill me-2" />
                  Créer un compte
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="mc-btn"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '12px', padding: '0.85rem 2rem', fontWeight: 600, fontSize: '1rem' }}>
                  <i className="bi bi-box-arrow-in-right me-2" />
                  Se connecter
                </button>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: '2rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
              {[
                { val: '500+', label: 'Patients' },
                { val: '50+',  label: 'Médecins' },
                { val: '24/7', label: 'Disponible' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>{s.val}</div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cartes droite */}
          <div className="col-lg-6 d-none d-lg-block">
            <div className="row g-3 ps-4">

              <div className="col-12">
                <div className="mc-hero-card">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <div className="icon-box">
                        <i className="bi bi-calendar2-check" />
                      </div>
                    </div>
                    <div className="col">
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                        Prise de rendez-vous en ligne
                      </div>
                      <div style={{ fontSize: '0.87rem', opacity: 0.8 }}>
                        Réservez en quelques clics, 24h/24
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6">
                <div className="mc-hero-card h-100">
                  <div className="icon-box">
                    <i className="bi bi-people-fill" />
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Patients</div>
                  <div style={{ fontSize: '0.83rem', opacity: 0.8 }}>Gérez vos rendez-vous simplement</div>
                </div>
              </div>

              <div className="col-6">
                <div className="mc-hero-card h-100">
                  <div className="icon-box">
                    <i className="bi bi-person-badge-fill" />
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Médecins</div>
                  <div style={{ fontSize: '0.83rem', opacity: 0.8 }}>Organisez votre planning facilement</div>
                </div>
              </div>

              <div className="col-12">
                <div className="mc-hero-card">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <div className="icon-box">
                        <i className="bi bi-shield-lock-fill" />
                      </div>
                    </div>
                    <div className="col">
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>
                        Données sécurisées
                      </div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                        Vos informations médicales protégées
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer bas */}
      <div className="mc-hero-footer">
        <div className="mc-hero-credits">
          <span>Développé par&nbsp;: <strong>Bouamar Ouissal</strong> &amp; <strong>Elgattoui Wissame</strong></span>
          <span className="mc-footer-sep">|</span>
          <span>Encadré par&nbsp;: <strong>M. Rhareb</strong></span>
        </div>
      </div>
    </div>
  );
}

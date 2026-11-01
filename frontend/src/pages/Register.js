import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    value: 'patient',
    title: 'Patient',
    desc: 'Je souhaite prendre des rendez-vous et suivre mes consultations.',
  },
  {
    value: 'medecin',
    title: 'Médecin',
    desc: 'Je veux gérer mon planning et mes rendez-vous patients.',
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [etape, setEtape]     = useState(1);          // 1=choix rôle, 2=formulaire
  const [role, setRole]       = useState('');
  const [form, setForm]       = useState({ nom: '', email: '', phone: '', password: '', password_confirmation: '', specialite: '' });
  const [erreur, setErreur]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const goEtape2 = () => {
    if (!role) { setErreur('Veuillez choisir un rôle.'); return; }
    setErreur('');
    setEtape(2);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErreur('');

    if (!form.nom || !form.email || !form.phone || !form.password || !form.password_confirmation) {
      setErreur('Tous les champs sont obligatoires.');
      return;
    }
    if (role === 'medecin' && !form.specialite.trim()) {
      setErreur('Veuillez indiquer votre spécialité.');
      return;
    }
    if (form.password !== form.password_confirmation) {
      setErreur('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const u = await register({ ...form, role });
      if (u.role === 'patient') navigate('/patient');
      if (u.role === 'medecin') navigate('/medecin');
      if (u.role === 'admin')   navigate('/admin');
    } catch (err) {
      console.error('Register error:', err);
      if (!err.response) {
        // Pas de réponse = CORS bloqué ou serveur éteint
        setErreur('Impossible de joindre le serveur. Vérifiez que Laravel tourne sur localhost:8000.');
      } else if (err.response.data?.errors) {
        const msgs = Object.values(err.response.data.errors).flat();
        setErreur(msgs[0]);
      } else {
        setErreur(`Erreur ${err.response.status} : ${err.response.data?.message || 'Une erreur est survenue.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-auth-page" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/background.png)` }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">

            {/* Logo */}
            <div className="text-center mb-4">
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                <img src="/logo.png" alt="MediCare Logo" style={{ height: '2.4rem', width: 'auto', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)', letterSpacing: '-0.5px' }}>
                  MediCare <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Solutions</span>
                </span>
              </Link>
            </div>

            <div className="mc-card">

              {/* Steps */}
              <div className="mc-steps">
                <div className="mc-step">
                  <div className={`step-num ${etape >= 1 ? 'done' : 'pending'}`}>1</div>
                  <div className={`step-label ${etape === 1 ? 'active' : ''}`}>Mon rôle</div>
                </div>
                <div className={`mc-step-line ${etape >= 2 ? 'done' : ''}`} />
                <div className="mc-step">
                  <div className={`step-num ${etape >= 2 ? 'active' : 'pending'}`}>2</div>
                  <div className={`step-label ${etape === 2 ? 'active' : ''}`}>Mon compte</div>
                </div>
              </div>

              {/* Erreur */}
              {erreur && (
                <div className="mc-alert mc-alert-error">
                  <i className="bi bi-exclamation-circle-fill me-2" />
                  {erreur}
                </div>
              )}

              {/* ===== ÉTAPE 1 : Choix du rôle ===== */}
              {etape === 1 && (
                <>
                  <div className="mc-card-header">
                    <div className="icon-wrap">
                      <i className="bi bi-person-plus" />
                    </div>
                    <h2>Qui êtes-vous ?</h2>
                    <p>Sélectionnez votre profil pour commencer</p>
                  </div>

                  <div className="row g-3 mb-4">
                    {ROLES.map(r => (
                      <div className="col-6" key={r.value}>
                        <div
                          className={`mc-role-card ${role === r.value ? 'selected' : ''}`}
                          onClick={() => { setRole(r.value); setErreur(''); }}
                        >
                          
                          <h5>{r.title}</h5>
                          <p>{r.desc}</p>
                          {role === r.value && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <i className="bi bi-check-circle-fill" style={{ color: 'var(--mc-blue)', fontSize: '1.2rem' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="mc-btn mc-btn-primary"
                    onClick={goEtape2}
                    disabled={!role}
                  >
                    Continuer
                    <i className="bi bi-arrow-right ms-2" />
                  </button>
                </>
              )}

              {/* ===== ÉTAPE 2 : Formulaire ===== */}
              {etape === 2 && (
                <>
                  <div className="mc-card-header">
                    <div className="icon-wrap" style={{ background: role === 'medecin' ? '#E8F5E9' : 'var(--mc-blue-bg)', color: role === 'medecin' ? '#388E3C' : 'var(--mc-blue)' }}>
                      <i className={`bi ${role === 'medecin' ? 'bi-person-badge' : 'bi-person'}`} />
                    </div>
                    <h2>Créer mon compte</h2>
                    <p>
                      Inscription en tant que{' '}
                      <strong style={{ color: 'var(--mc-blue)' }}>
                        {role === 'patient' ? 'Patient' : 'Médecin'}
                      </strong>
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} noValidate>
                    <div className="mc-input-group">
                      <label>Nom complet</label>
                      <div className="input-wrap">
                        <i className="bi bi-person" />
                        <input name="nom" type="text" className="form-control"
                          placeholder="user" value={form.nom} onChange={handleChange} autoFocus />
                      </div>
                    </div>

                    <div className="mc-input-group">
                      <label>Adresse email</label>
                      <div className="input-wrap">
                        <i className="bi bi-envelope" />
                        <input name="email" type="email" className="form-control"
                          placeholder="user@gmail.com" value={form.email} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="mc-input-group">
                      <label>Téléphone</label>
                      <div className="input-wrap">
                        <i className="bi bi-telephone" />
                        <input name="phone" type="tel" className="form-control"
                          placeholder="0612345678" value={form.phone} onChange={handleChange} />
                      </div>
                    </div>

                    {role === 'medecin' && (
                      <div className="mc-input-group">
                        <label>Spécialité</label>
                        <div className="input-wrap">
                          <i className="bi bi-award" />
                          <input name="specialite" type="text" className="form-control"
                            placeholder="Ex: Cardiologie, Pédiatrie…" value={form.specialite} onChange={handleChange} />
                        </div>
                      </div>
                    )}

                    <div className="mc-input-group">
                      <label>Mot de passe</label>
                      <div className="input-wrap">
                        <i className="bi bi-lock" />
                        <input name="password" type={showPwd ? 'text' : 'password'} className="form-control has-eye"
                          placeholder="Min. 6 caractères" value={form.password} onChange={handleChange} />
                        <button type="button" className="btn-eye" onClick={() => setShowPwd(!showPwd)}>
                          <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="mc-input-group">
                      <label>Confirmer le mot de passe</label>
                      <div className="input-wrap">
                        <i className="bi bi-lock-fill" />
                        <input name="password_confirmation" type={showPwd ? 'text' : 'password'} className="form-control has-eye"
                          placeholder="Répéter le mot de passe" value={form.password_confirmation} onChange={handleChange} />
                        <button type="button" className="btn-eye" onClick={() => setShowPwd(!showPwd)}>
                          <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                      <button type="button" className="mc-btn mc-btn-outline"
                        onClick={() => { setEtape(1); setErreur(''); }}
                        style={{ width: 'auto', padding: '0.72rem 1.25rem' }}>
                        <i className="bi bi-arrow-left me-1" />
                        Retour
                      </button>
                      <button type="submit" className="mc-btn mc-btn-primary" disabled={loading}>
                        {loading
                          ? <><span className="spinner-border spinner-border-sm me-2" />Création…</>
                          : <><i className="bi bi-check-lg me-2" />Créer mon compte</>
                        }
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Lien connexion */}
              <div className="mc-divider">ou</div>
              <div className="text-center" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>
                Déjà inscrit ?{' '}
                <Link to="/login" style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>
                  Se connecter
                </Link>
              </div>
            </div>

            <div className="text-center mt-3">
              <Link to="/" style={{ color: 'var(--mc-grey)', fontSize: '0.85rem', textDecoration: 'none' }}>
                <i className="bi bi-arrow-left me-1" />
                Retour à l'accueil
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

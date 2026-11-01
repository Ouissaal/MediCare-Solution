import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [erreur, setErreur]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Si déjà connecté
  useEffect(() => {
    if (!user) return;
    if (user.role === 'patient') navigate('/patient');
    if (user.role === 'medecin') navigate('/medecin');
    if (user.role === 'admin')   navigate('/admin');
  }, [user, navigate]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setErreur('');

    if (!form.email || !form.password) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      if (u.role === 'patient') navigate('/patient');
      if (u.role === 'medecin') navigate('/medecin');
      if (u.role === 'admin')   navigate('/admin');
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        setErreur(msgs[0] || 'Identifiants incorrects.');
      } else if (err.response?.status === 401) {
        setErreur('Email ou mot de passe incorrect.');
      } else if (err.response?.status === 403) {
        setErreur('Votre compte a été désactivé.');
      } else {
        setErreur('Impossible de se connecter. Vérifiez votre connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-auth-page" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/background.png)` }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">

            {/* Logo retour accueil */}
            <div className="text-center mb-4">
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                <img src="/logo.png" alt="MediCare Logo" style={{ height: '2.4rem', width: 'auto', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)', letterSpacing: '-0.5px' }}>
                  MediCare <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Solutions</span>
                </span>
              </Link>
            </div>

            <div className="mc-card">
              {/* En-tête */}
              <div className="mc-card-header">
                <div className="icon-wrap">
                  <i className="bi bi-person-lock" />
                </div>
                <h2>Connexion</h2>
                <p>Accédez à votre espace personnel</p>
              </div>

              {/* Erreur */}
              {erreur && (
                <div className="mc-alert mc-alert-error">
                  <i className="bi bi-exclamation-circle-fill me-2" />
                  {erreur}
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mc-input-group">
                  <label htmlFor="email">Adresse email</label>
                  <div className="input-wrap">
                    <i className="bi bi-envelope" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control"
                      placeholder="vous@gmail.com"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="mc-input-group">
                  <label htmlFor="password">Mot de passe</label>
                  <div className="input-wrap">
                    <i className="bi bi-lock" />
                    <input
                      id="password"
                      name="password"
                      type={showPwd ? 'text' : 'password'}
                      className="form-control has-eye"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                    />
                    <button type="button" className="btn-eye" onClick={() => setShowPwd(!showPwd)}>
                      <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <button type="submit" className="mc-btn mc-btn-primary" disabled={loading}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2" />Connexion…</>
                      : <><i className="bi bi-box-arrow-in-right me-2" />Se connecter</>
                    }
                  </button>
                </div>
              </form>

              {/* Séparateur + lien inscription */}
              <div className="mc-divider">ou</div>

              <div className="text-center" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>
                Pas encore de compte ?{' '}
                <Link to="/register" style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>
                  S'inscrire
                </Link>
              </div>
            </div>

            {/* Retour accueil */}
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

import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import NotificationBell from '../../components/NotificationBell';
import api from '../../services/api';

// ─── Navigation sidebar patient ───────────────────────────────────────────────
const LINKS = [
  { to: '/patient',           icon: 'bi-grid-fill',          label: 'Tableau de bord', end: true },
  { to: '/patient/rdv',       icon: 'bi-calendar2-check',    label: 'Mes rendez-vous' },
  { to: '/patient/reserver',  icon: 'bi-plus-circle-fill',   label: 'Prendre un RDV' },
  { to: '/patient/profil',    icon: 'bi-person-circle',      label: 'Mon profil' },
];

// ─── Badge statut ──────────────────────────────────────────────────────────────
function BadgeStatut({ statut }) {
  const map = {
    EN_ATTENTE: { cls: 'badge-en-attente', label: 'En attente' },
    CONFIRME:   { cls: 'badge-confirme',   label: 'Confirmé'   },
    ANNULE:     { cls: 'badge-annule',     label: 'Annulé'     },
  };
  const b = map[statut] || { cls: '', label: statut };
  return <span className={`mc-badge ${b.cls}`}>{b.label}</span>;
}

// ─── Accueil patient ───────────────────────────────────────────────────────────
function Accueil() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rdvs,         setRdvs]         = useState([]);
  const [medecins,     setMedecins]     = useState([]);
  const [dispoSemaine, setDispoSemaine] = useState([]);
  const [recherche,    setRecherche]    = useState('');
  const [loading,      setLoading]      = useState(true);
  const [modalMedecin, setModalMedecin] = useState(null); // medecin object or null

  useEffect(() => {
    api.get('/patient/rendezvous')
      .then(res => setRdvs(res.data.slice(0, 3)))
      .finally(() => setLoading(false));

    api.get('/patient/medecins').then(res => setMedecins(res.data));
    api.get('/patient/disponibilites-semaine').then(res => setDispoSemaine(res.data));
  }, []);

  const medecinsFiltres = medecins.filter(m =>
    m.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    (m.specialite || '').toLowerCase().includes(recherche.toLowerCase())
  );

  // Build lookup: medecin_id → all slots this week
  const dispoParMedecin = dispoSemaine.reduce((acc, d) => {
    if (!acc[d.medecin_id]) acc[d.medecin_id] = [];
    acc[d.medecin_id].push(d);
    return acc;
  }, {});


  return (
    <>
      <div className="mc-topbar">
        <h4>Tableau de bord</h4>
        <NotificationBell />
      </div>
      <div className="mc-content">
        {/* Bienvenue */}
        <div className="mc-welcome">
          <h3>Bonjour, {user?.nom} </h3>
          <p>Bienvenue sur votre espace patient MediCare Solutions.</p>
        </div>

        {/* Derniers RDV */}
        {loading ? (
          <div className="text-center py-3"><div className="spinner-border text-primary" /></div>
        ) : null}
        <div className="mc-table-wrap">
          <div className="mc-table-title">
            Derniers rendez-vous
            <NavLink to="/patient/rdv" style={{ fontSize: '0.83rem', color: 'var(--mc-blue)', textDecoration: 'none', fontWeight: 600 }}>
              Voir tout <i className="bi bi-arrow-right" />
            </NavLink>
          </div>
          {rdvs.length === 0 ? (
            <div className="text-center py-4" style={{ color: 'var(--mc-grey)' }}>
              <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }} />
              <div className="mt-2">Aucun rendez-vous pour l'instant.</div>
              <NavLink to="/patient/reserver" className="btn btn-primary btn-sm mt-2">
                Prendre un rendez-vous
              </NavLink>
            </div>
          ) : (
            <table className="table table-hover mb-0">
              <thead><tr>
                <th>Médecin</th><th>Spécialité</th><th>Date & Heure</th><th>Statut</th>
              </tr></thead>
              <tbody>
                {rdvs.map(r => (
                  <tr key={r.id}>
                    <td><i className="bi bi-person-badge me-1 text-primary" />{r.medecin?.nom}</td>
                    <td>{r.medecin?.specialite}</td>
                    <td>{new Date(r.date_heure).toLocaleString('fr-FR')}</td>
                    <td><BadgeStatut statut={r.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Médecins disponibles */}
        <div className="mc-table-wrap mt-4">
          <div className="mc-table-title">
            <span><i className="bi bi-people-fill me-2 text-primary" />Médecins disponibles</span>
            <NavLink to="/patient/reserver" style={{ fontSize: '0.83rem', color: 'var(--mc-blue)', textDecoration: 'none', fontWeight: 600 }}>
              Prendre un RDV <i className="bi bi-arrow-right" />
            </NavLink>
          </div>

          {/* Barre de recherche */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--mc-border)' }}>
            <div style={{ position: 'relative', maxWidth: 340 }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mc-grey-light)' }} />
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Rechercher par nom ou spécialité…"
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{ paddingLeft: '2.1rem', borderRadius: '8px' }}
              />
            </div>
          </div>

          {medecinsFiltres.length === 0 ? (
            <div className="text-center py-4" style={{ color: 'var(--mc-grey)' }}>
              <i className="bi bi-person-x" style={{ fontSize: '2rem' }} />
              <div className="mt-2">Aucun médecin trouvé.</div>
            </div>
          ) : (
            <div className="row g-3 p-3">
              {medecinsFiltres.map(m => (
                <div key={m.id} className="col-md-4 col-sm-6">
                  <div style={{
                    border: '1px solid var(--mc-border)', borderRadius: 12,
                    padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
                    background: 'var(--mc-bg)', transition: 'box-shadow 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: 'var(--mc-blue-bg)', color: 'var(--mc-blue)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1.1rem', flexShrink: 0,
                      }}>
                        {m.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.93rem', color: 'var(--mc-grey-dark)' }}>{m.nom}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--mc-blue)', fontWeight: 600 }}>{m.specialite}</div>
                      </div>
                    </div>
                    {m.phone && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--mc-grey)' }}>
                        <i className="bi bi-telephone me-1" />{m.phone}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <button
                        className="btn btn-sm btn-primary flex-fill"
                        style={{ borderRadius: 8, fontSize: '0.8rem' }}
                        onClick={() => navigate('/patient/reserver', { state: { medecin_id: m.id } })}
                      >
                        <i className="bi bi-calendar-plus me-1" />Prendre RDV
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        style={{ borderRadius: 8, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        onClick={() => setModalMedecin(m)}
                      >
                        <i className="bi bi-eye me-1" />Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal détails médecin ── */}
      {modalMedecin && (
        <div
          onClick={() => setModalMedecin(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ background: 'var(--mc-blue)', padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.2rem',
                }}>
                  {modalMedecin.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{modalMedecin.nom}</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>{modalMedecin.specialite}</div>
                </div>
              </div>
              <button onClick={() => setModalMedecin(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.2rem 1.4rem' }}>
              {/* Infos */}
              {modalMedecin.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.88rem', color: '#374151' }}>
                  <i className="bi bi-telephone-fill text-primary" />
                  <span>{modalMedecin.phone}</span>
                </div>
              )}

              {/* Disponibilités */}
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827', marginBottom: '0.6rem' }}>
                <i className="bi bi-calendar-week me-2 text-primary" />Disponibilités — semaine en cours
              </div>

              {(dispoParMedecin[modalMedecin.id] || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
                  <i className="bi bi-calendar-x" style={{ fontSize: '1.6rem' }} />
                  <div className="mt-1">Aucun créneau disponible cette semaine.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dispoParMedecin[modalMedecin.id].map((d, i) => {
                    const dispo = d.statut === 'Disponible';
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.6rem 0.9rem', borderRadius: 10,
                        background: dispo ? '#F0FDF4' : '#FEF2F2',
                        border: `1px solid ${dispo ? '#86EFAC' : '#FCA5A5'}`,
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>
                            <i className="bi bi-calendar3 me-1 text-primary" />{d.jour_label}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.1rem' }}>
                            <i className="bi bi-clock me-1" />{d.heure_debut} – {d.heure_fin}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-block', padding: '0.2rem 0.6rem',
                            borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                            background: dispo ? '#DCFCE7' : '#FEE2E2',
                            color: dispo ? '#166534' : '#991B1B',
                          }}>
                            <i className={`bi ${dispo ? 'bi-check-circle' : 'bi-x-circle'} me-1`} />
                            {dispo ? `${d.places_disponibles} place${d.places_disponibles > 1 ? 's' : ''}` : 'Complet'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action */}
              <NavLink
                to="/patient/reserver"
                className="btn btn-primary w-100 mt-3"
                style={{ borderRadius: 10, fontWeight: 600 }}
                onClick={() => setModalMedecin(null)}
              >
                <i className="bi bi-calendar-plus me-2" />Prendre un rendez-vous
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const TYPE_LABELS_PATIENT = {
  premiere_consultation: 'Première consultation',
  controle: 'Contrôle',
  suivi: 'Suivi',
  urgence: 'Urgence',
};

// ─── Mes rendez-vous ───────────────────────────────────────────────────────────
function MesRdv() {
  const [rdvs,         setRdvs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [msg,          setMsg]          = useState('');
  const [ouvert,       setOuvert]       = useState(null);
  const [modif,        setModif]        = useState(null);   // id du rdv en cours de modification
  const [modifForm,    setModifForm]    = useState({});
  const [modifLoading, setModifLoading] = useState(false);

  const charger = () => {
    setLoading(true);
    api.get('/patient/rendezvous').then(res => setRdvs(res.data)).finally(() => setLoading(false));
  };
  useEffect(charger, []);

  const annuler = async id => {
    if (!window.confirm('Annuler ce rendez-vous ?')) return;
    try {
      await api.delete(`/patient/rendezvous/${id}`);
      setMsg('Rendez-vous annulé.');
      charger();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Erreur lors de l\'annulation.');
    }
  };

  const ouvrirModif = rdv => {
    // Formater la date pour l'input datetime-local
    const d = new Date(rdv.date_heure);
    const pad = n => String(n).padStart(2, '0');
    const localStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setModifForm({
      date_heure:            localStr,
      type_consultation:     rdv.type_consultation,
      motif:                 rdv.motif || '',
      symptomes:             rdv.symptomes || '',
      medicaments_actuels:   rdv.medicaments_actuels || '',
      allergies:             rdv.allergies || '',
      notes_patient:         rdv.notes_patient || '',
      ordonnance_precedente: rdv.ordonnance_precedente || false,
    });
    setModif(rdv.id);
    setOuvert(null);
  };

  const soumettreModif = async id => {
    setModifLoading(true);
    setMsg('');
    try {
      const dt = modifForm.date_heure.replace('T', ' ').slice(0, 16);
      await api.put(`/patient/rendezvous/${id}`, { ...modifForm, date_heure: dt });
      setMsg('Rendez-vous modifié avec succès.');
      setModif(null);
      charger();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Erreur lors de la modification.');
    } finally {
      setModifLoading(false);
    }
  };

  const setMf = (key, val) => setModifForm(f => ({ ...f, [key]: val }));

  return (
    <>
      <div className="mc-topbar"><h4>Mes rendez-vous</h4><NotificationBell /></div>
      <div className="mc-content">
        {/* Info banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem',
          fontSize: '0.86rem', color: '#1E40AF',
        }}>
          <i className="bi bi-info-circle-fill" style={{ fontSize: '1.1rem', flexShrink: 0 }} />
          <span>
            <strong>Important :</strong> Une fois votre rendez-vous <strong>confirmé</strong> par le médecin, il ne vous sera plus possible de l'annuler.
          </span>
        </div>
        {msg && <div className="mc-alert mc-alert-success"><i className="bi bi-check-circle me-2"/>{msg}</div>}
        <div className="mc-table-wrap">
          <div className="mc-table-title">Tous mes rendez-vous</div>
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
          ) : rdvs.length === 0 ? (
            <div className="text-center py-4" style={{ color: 'var(--mc-grey)' }}>
              <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }} /><br />
              <span>Aucun rendez-vous trouvé.</span>
            </div>
          ) : (
            <table className="table table-hover mb-0">
              <thead><tr>
                <th>Médecin</th><th>Spécialité</th><th>Date & Heure</th><th>Type</th><th>Statut</th><th>Action</th>
              </tr></thead>
              <tbody>
                {rdvs.map(r => (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td>{r.medecin?.nom}</td>
                      <td>{r.medecin?.specialite}</td>
                      <td>{new Date(r.date_heure).toLocaleString('fr-FR')}</td>
                      <td>
                        <span style={{ fontSize:'0.8rem', color:'#3730A3' }}>
                          {TYPE_LABELS_PATIENT[r.type_consultation] || r.type_consultation}
                        </span>
                      </td>
                      <td><BadgeStatut statut={r.statut} /></td>
                      <td>
                        <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
                          {r.notes_medecin && (
                            <button className="btn btn-sm btn-outline-info" title="Voir le compte-rendu"
                              onClick={() => { setOuvert(o => o === r.id ? null : r.id); setModif(null); }}>
                              <i className={`bi ${ouvert === r.id ? 'bi-chevron-up' : 'bi-file-medical'}`}/>
                            </button>
                          )}
                          {r.statut === 'EN_ATTENTE' && (
                            <button className="btn btn-sm btn-outline-warning" title="Modifier"
                              onClick={() => modif === r.id ? setModif(null) : ouvrirModif(r)}>
                              <i className={`bi ${modif === r.id ? 'bi-chevron-up' : 'bi-pencil-square'}`}/>
                            </button>
                          )}
                          {r.statut === 'EN_ATTENTE' && (
                            <button className="btn btn-sm btn-outline-danger"
                              onClick={() => annuler(r.id)}>
                              <i className="bi bi-x-circle me-1" />Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>


                    {/* ── Formulaire de modification ── */}
                    {modif === r.id && (
                      <tr>
                        <td colSpan="6" style={{ background:'#FFFBEB', padding:'1.25rem 1.5rem' }}>
                          <strong style={{ color:'var(--mc-blue)' }}>
                            <i className="bi bi-pencil-square me-2"/>Modifier le rendez-vous
                          </strong>
                          <div className="row g-3 mt-1">
                            <div className="col-md-6">
                              <label className="form-label" style={{ fontSize:'0.85rem', fontWeight:600 }}>Date & Heure</label>
                              <input type="datetime-local" className="form-control form-control-sm"
                                value={modifForm.date_heure}
                                min={new Date().toISOString().slice(0,16)}
                                onChange={e => setMf('date_heure', e.target.value)} />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label" style={{ fontSize:'0.85rem', fontWeight:600 }}>Type de consultation</label>
                              <select className="form-control form-control-sm"
                                value={modifForm.type_consultation}
                                onChange={e => setMf('type_consultation', e.target.value)}>
                                <option value="premiere_consultation">Première consultation</option>
                                <option value="controle">Contrôle</option>
                                <option value="suivi">Suivi</option>
                                <option value="urgence">Urgence</option>
                              </select>
                            </div>
                            <div className="col-12">
                              <label className="form-label" style={{ fontSize:'0.85rem', fontWeight:600 }}>Motif</label>
                              <textarea className="form-control form-control-sm" rows="2"
                                value={modifForm.motif}
                                onChange={e => setMf('motif', e.target.value)} />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label" style={{ fontSize:'0.85rem', fontWeight:600 }}>Symptômes</label>
                              <textarea className="form-control form-control-sm" rows="2"
                                value={modifForm.symptomes}
                                onChange={e => setMf('symptomes', e.target.value)} />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label" style={{ fontSize:'0.85rem', fontWeight:600 }}>Médicaments en cours</label>
                              <input type="text" className="form-control form-control-sm"
                                value={modifForm.medicaments_actuels}
                                onChange={e => setMf('medicaments_actuels', e.target.value)} />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label" style={{ fontSize:'0.85rem', fontWeight:600 }}>Allergies</label>
                              <input type="text" className="form-control form-control-sm"
                                value={modifForm.allergies}
                                onChange={e => setMf('allergies', e.target.value)} />
                            </div>
                            <div className="col-md-6 d-flex align-items-end">
                              <div className="form-check">
                                <input type="checkbox" className="form-check-input" id={`ordo-${r.id}`}
                                  checked={modifForm.ordonnance_precedente}
                                  onChange={e => setMf('ordonnance_precedente', e.target.checked)} />
                                <label className="form-check-label" htmlFor={`ordo-${r.id}`} style={{ fontSize:'0.85rem' }}>
                                  J'ai une ordonnance précédente
                                </label>
                              </div>
                            </div>
                            <div className="col-12">
                              <label className="form-label" style={{ fontSize:'0.85rem', fontWeight:600 }}>Notes complémentaires</label>
                              <textarea className="form-control form-control-sm" rows="2"
                                value={modifForm.notes_patient}
                                onChange={e => setMf('notes_patient', e.target.value)} />
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:'0.5rem', marginTop:'1rem' }}>
                            <button className="btn btn-sm btn-primary" disabled={modifLoading}
                              onClick={() => soumettreModif(r.id)}>
                              {modifLoading
                                ? <><span className="spinner-border spinner-border-sm me-1"/>Enregistrement…</>
                                : <><i className="bi bi-floppy me-1"/>Enregistrer</>}
                            </button>
                            <button className="btn btn-sm btn-outline-secondary"
                              onClick={() => setModif(null)}>
                              Annuler
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

const TYPE_CONSULTATION = [
  { value: 'premiere_consultation', label: 'Première consultation' },
  { value: 'controle',              label: 'Contrôle' },
  { value: 'suivi',                 label: 'Suivi' },
  { value: 'urgence',               label: 'Urgence' },
];

// ─── Prendre un RDV ───────────────────────────────────────────────────────────
function PrendreRdv() {
  const location = useLocation();
  const [medecins,         setMedecins]         = useState([]);
  const [filtreSpecialite, setFiltreSpecialite] = useState('');
  const [form, setForm] = useState({
    medecin_id: location.state?.medecin_id ? String(location.state.medecin_id) : '',
    date_heure: '',
    type_consultation: 'premiere_consultation',
    motif: '', symptomes: '',
    ordonnance_precedente: false,
    medicaments_actuels: '', allergies: '', notes_patient: '',
  });
  const [msg,     setMsg]     = useState('');
  const [erreur,  setErreur]  = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/patient/medecins').then(res => setMedecins(res.data));
  }, []);

  const specialites     = [...new Set(medecins.map(m => m.specialite).filter(Boolean))].sort();
  const medecinsFiltres = medecins
    .filter(m => !filtreSpecialite || m.specialite === filtreSpecialite);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async e => {
    e.preventDefault();
    setErreur(''); setMsg('');
    if (!form.medecin_id || !form.date_heure) { setErreur('Veuillez choisir un médecin et une date.'); return; }
    if (!form.motif.trim()) { setErreur('Veuillez indiquer le motif de la consultation.'); return; }
    setLoading(true);
    try {
      const dt = form.date_heure.replace('T', ' ').slice(0, 16);
      await api.post('/patient/rendezvous', {
        medecin_id:            parseInt(form.medecin_id),
        date_heure:            dt,
        type_consultation:     form.type_consultation,
        motif:                 form.motif,
        symptomes:             form.symptomes || null,
        ordonnance_precedente: form.ordonnance_precedente,
        medicaments_actuels:   form.medicaments_actuels || null,
        allergies:             form.allergies || null,
        notes_patient:         form.notes_patient || null,
      });
      setMsg('Rendez-vous pris avec succès !');
      setForm({
        medecin_id: '', date_heure: '',
        type_consultation: 'premiere_consultation',
        motif: '', symptomes: '',
        ordonnance_precedente: false,
        medicaments_actuels: '', allergies: '', notes_patient: '',
      });
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la réservation.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="mc-topbar"><h4>Prendre un rendez-vous</h4><NotificationBell /></div>
      <div className="mc-content">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            <div className="mc-table-wrap p-4">
              {msg    && <div className="mc-alert mc-alert-success"><i className="bi bi-check-circle me-2"/>{msg}</div>}
              {erreur && <div className="mc-alert mc-alert-error"><i className="bi bi-exclamation-circle me-2"/>{erreur}</div>}
              <form onSubmit={handleSubmit}>

                {/* ── Bloc 1 : Choix médecin & créneau ── */}
                <h6 style={{ fontWeight:700, color:'var(--mc-blue)', marginBottom:'0.75rem' }}>
                  <i className="bi bi-person-badge me-2"/>Médecin & créneau
                </h6>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="mc-input-group">
                      <label>Filtrer par spécialité</label>
                      <select className="form-control" value={filtreSpecialite}
                        onChange={e => { setFiltreSpecialite(e.target.value); set('medecin_id', ''); }}>
                        <option value="">— Toutes les spécialités —</option>
                        {specialites.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mc-input-group">
                      <label>Médecin <span style={{color:'red'}}>*</span></label>
                      <select className="form-control" value={form.medecin_id}
                        onChange={e => set('medecin_id', e.target.value)}>
                        <option value="">— Sélectionner —</option>
                        {medecinsFiltres.map(m => (
                          <option key={m.id} value={m.id}>{m.nom} — {m.specialite}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mc-input-group">
                      <label>Date et heure <span style={{color:'red'}}>*</span></label>
                      <input type="datetime-local" className="form-control"
                        value={form.date_heure} onChange={e => set('date_heure', e.target.value)}
                        min={new Date().toISOString().slice(0, 16)} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mc-input-group">
                      <label>Type de consultation <span style={{color:'red'}}>*</span></label>
                      <select className="form-control" value={form.type_consultation}
                        onChange={e => set('type_consultation', e.target.value)}>
                        {TYPE_CONSULTATION.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <hr style={{ margin: '1rem 0' }} />

                {/* ── Bloc 2 : Informations médicales ── */}
                <h6 style={{ fontWeight:700, color:'var(--mc-blue)', marginBottom:'0.75rem' }}>
                  <i className="bi bi-clipboard2-pulse me-2"/>Informations médicales
                </h6>
                <div className="mc-input-group">
                  <label>Motif de la consultation <span style={{color:'red'}}>*</span></label>
                  <textarea className="form-control" rows="2" placeholder="Décrivez brièvement la raison de votre visite…"
                    value={form.motif} onChange={e => set('motif', e.target.value)} />
                </div>
                <div className="mc-input-group">
                  <label>Symptômes</label>
                  <textarea className="form-control" rows="2" placeholder="Douleur, fièvre, fatigue… (facultatif)"
                    value={form.symptomes} onChange={e => set('symptomes', e.target.value)} />
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="mc-input-group">
                      <label>Médicaments en cours</label>
                      <input type="text" className="form-control" placeholder="Ex : Paracétamol, Aspirine…"
                        value={form.medicaments_actuels} onChange={e => set('medicaments_actuels', e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mc-input-group">
                      <label>Allergies connues</label>
                      <input type="text" className="form-control" placeholder="Ex : Pénicilline, pollen…"
                        value={form.allergies} onChange={e => set('allergies', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Ordonnance précédente */}
                <div className="mc-input-group">
                  <div className="form-check" style={{ marginTop: '0.25rem' }}>
                    <input type="checkbox" className="form-check-input" id="ordoPrev"
                      checked={form.ordonnance_precedente}
                      onChange={e => set('ordonnance_precedente', e.target.checked)} />
                    <label className="form-check-label" htmlFor="ordoPrev" style={{ cursor:'pointer' }}>
                      J'ai une ancienne ordonnance à apporter
                    </label>
                  </div>
                </div>

                <div className="mc-input-group">
                  <label>Notes complémentaires <small style={{ fontWeight:400, color:'var(--mc-grey)' }}>(facultatif)</small></label>
                  <textarea className="form-control" rows="2" placeholder="Toute autre information utile pour le médecin…"
                    value={form.notes_patient} onChange={e => set('notes_patient', e.target.value)} />
                </div>

                <button type="submit" className="mc-btn mc-btn-primary mt-2" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2"/>Réservation…</>
                    : <><i className="bi bi-calendar-plus me-2"/>Confirmer le rendez-vous</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Profil patient ───────────────────────────────────────────────────────────
function Profil() {
  const { user } = useAuth();
  const [form,   setForm]   = useState({ phone: user?.phone || '', password: '', password_confirmation: '' });
  const [msg,    setMsg]    = useState('');
  const [erreur, setErreur] = useState('');
  const [loading,setLoading]= useState(false);

  const handleSubmit = async e => {
    e.preventDefault(); setMsg(''); setErreur('');
    const payload = {};
    if (form.phone)    payload.phone = form.phone;
    if (form.password) { payload.password = form.password; payload.password_confirmation = form.password_confirmation; }
    setLoading(true);
    try {
      await api.put('/patient/profil', payload);
      setMsg('Profil mis à jour avec succès.');
      setForm(f => ({ ...f, password: '', password_confirmation: '' }));
    } catch (err) {
      const msgs = Object.values(err.response?.data?.errors || {}).flat();
      setErreur(msgs[0] || err.response?.data?.message || 'Erreur.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="mc-topbar"><h4>Mon profil</h4><NotificationBell /></div>
      <div className="mc-content">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="mc-table-wrap p-4">
              <div className="text-center mb-3">
                <div style={{ width:70, height:70, borderRadius:'50%', background:'var(--mc-blue)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 0.75rem', fontSize:'1.8rem', color:'white', fontWeight:800 }}>
                  {user?.nom?.charAt(0).toUpperCase()}
                </div>
                <h5 style={{ fontWeight:700 }}>{user?.nom}</h5>
                <span className="mc-badge" style={{ background:'var(--mc-blue-bg)', color:'var(--mc-blue)', border:'1px solid var(--mc-blue)' }}>Patient</span>
              </div>
              <hr />
              {msg    && <div className="mc-alert mc-alert-success"><i className="bi bi-check-circle me-2"/>{msg}</div>}
              {erreur && <div className="mc-alert mc-alert-error"><i className="bi bi-exclamation-circle me-2"/>{erreur}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mc-input-group">
                  <label>Nom</label>
                  <input className="form-control" value={user?.nom || ''} disabled />
                </div>
                <div className="mc-input-group">
                  <label>Email</label>
                  <input className="form-control" value={user?.email || ''} disabled />
                </div>
                <div className="mc-input-group">
                  <label>Téléphone</label>
                  <input className="form-control" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0612345678" />
                </div>
                <div className="mc-input-group">
                  <label>Nouveau mot de passe <small style={{fontWeight:400,color:'var(--mc-grey)'}}>(laisser vide pour ne pas changer)</small></label>
                  <input type="password" className="form-control" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="mc-input-group">
                  <label>Confirmer le mot de passe</label>
                  <input type="password" className="form-control" value={form.password_confirmation}
                    onChange={e => setForm({ ...form, password_confirmation: e.target.value })} placeholder="••••••••" />
                </div>
                <button type="submit" className="mc-btn mc-btn-primary mt-2" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2"/>Enregistrement…</> : <><i className="bi bi-floppy me-2"/>Enregistrer</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Dashboard Patient (layout) ────────────────────────────────────────────────
export default function PatientDashboard() {
  return (
    <div className="mc-layout">
      <Sidebar title="Patient" links={LINKS} />
      <main className="mc-main">
        <Routes>
          <Route index            element={<Accueil />} />
          <Route path="rdv"       element={<MesRdv />} />
          <Route path="reserver"  element={<PrendreRdv />} />
          <Route path="profil"    element={<Profil />} />
        </Routes>
        <Footer />
      </main>
    </div>
  );
}

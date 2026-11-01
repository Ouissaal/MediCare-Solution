import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import api from '../../services/api';

const LINKS = [
  { to: '/medecin',          icon: 'bi-grid-fill',        label: 'Tableau de bord', end: true },
  { to: '/medecin/rdv',      icon: 'bi-calendar2-check',  label: 'Mes rendez-vous' },
  { to: '/medecin/planning', icon: 'bi-clock-history',    label: 'Mon planning' },
];

const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function BadgeStatut({ statut }) {
  const map = {
    EN_ATTENTE: { cls: 'badge-en-attente', label: 'En attente' },
    CONFIRME:   { cls: 'badge-confirme',   label: 'Confirmé'   },
    ANNULE:     { cls: 'badge-annule',     label: 'Annulé'     },
  };
  const b = map[statut] || { cls: '', label: statut };
  return <span className={`mc-badge ${b.cls}`}>{b.label}</span>;
}

// ─── Accueil médecin ──────────────────────────────────────────────────────────
function Accueil() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [rdvs,    setRdvs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const today    = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      api.get('/medecin/stats'),
      api.get('/medecin/rendezvous', { params: { date: todayISO } }),
    ]).then(([sRes, rRes]) => {
      setStats(sRes.data);
      setRdvs(rRes.data.slice(0, 4));
    }).finally(() => setLoading(false));
  }, [todayISO]);

  return (
    <>
      <div className="mc-topbar">
        <h4>Tableau de bord</h4>
        <span className="date"><i className="bi bi-calendar3 me-1"/>{today}</span>
      </div>
      <div className="mc-content">
        <div className="mc-welcome">
          <h3>Bonjour, Dr. {user?.nom} </h3>
          <p>Bienvenue sur votre espace médecin MediCare Solutions.</p>
        </div>

        {loading ? (
          <div className="text-center py-3"><div className="spinner-border text-primary"/></div>
        ) : (
          <>
            {/* 3 boutons résumé */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <NavLink to="/medecin/rdv" style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--mc-blue)', borderRadius: 14, padding: '1.4rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'white', cursor: 'pointer' }}>
                    <i className="bi bi-person-check-fill" style={{ fontSize: '2rem', opacity: 0.9 }}/>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{stats?.patients_aujourd_hui ?? 0}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.2rem' }}>Patients aujourd'hui</div>
                    </div>
                  </div>
                </NavLink>
              </div>
              <div className="col-md-4">
                <NavLink to="/medecin/rdv" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#22c55e', borderRadius: 14, padding: '1.4rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'white', cursor: 'pointer' }}>
                    <i className="bi bi-calendar2-check-fill" style={{ fontSize: '2rem', opacity: 0.9 }}/>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{stats?.rendezvous_a_venir ?? 0}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.2rem' }}>RDV à venir</div>
                    </div>
                  </div>
                </NavLink>
              </div>
              <div className="col-md-4">
                <NavLink to="/medecin/rdv" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#f59e0b', borderRadius: 14, padding: '1.4rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'white', cursor: 'pointer' }}>
                    <i className="bi bi-hourglass-split" style={{ fontSize: '2rem', opacity: 0.9 }}/>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{stats?.rendezvous_en_attente ?? 0}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.2rem' }}>En attente</div>
                    </div>
                  </div>
                </NavLink>
              </div>
            </div>

            {/* RDV du jour */}
            <div className="mc-table-wrap">
              <div className="mc-table-title">
                Rendez-vous d'aujourd'hui
                <NavLink to="/medecin/rdv" style={{ fontSize:'0.83rem', color:'var(--mc-blue)', textDecoration:'none', fontWeight:600 }}>
                  Voir tout <i className="bi bi-arrow-right"/>
                </NavLink>
              </div>
              {rdvs.length === 0 ? (
                <div className="text-center py-4" style={{ color:'var(--mc-grey)' }}>
                  <i className="bi bi-calendar-x" style={{ fontSize:'2rem' }}/><br/>Aucun rendez-vous aujourd'hui.
                </div>
              ) : (
                <table className="table table-hover mb-0">
                  <thead><tr><th>Patient</th><th>Heure</th><th>Statut</th><th>Action</th></tr></thead>
                  <tbody>
                    {rdvs.map(r => (
                      <tr key={r.id}>
                        <td><i className="bi bi-person-circle me-1 text-primary"/>{r.patient?.nom}</td>
                        <td>{new Date(r.date_heure).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</td>
                        <td><BadgeStatut statut={r.statut}/></td>
                        <td>
                          <NavLink to="/medecin/rdv" className="btn btn-sm btn-outline-primary">Gérer</NavLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

const TYPE_LABELS = {
  premiere_consultation: 'Première consultation',
  controle: 'Contrôle',
  suivi: 'Suivi',
  urgence: 'Urgence',
};

// ─── Rendez-vous médecin ──────────────────────────────────────────────────────
function MesRdv() {
  const [rdvs,       setRdvs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState('');
  const [filtreDate, setFiltreDate] = useState('');
  const [ouvert, setOuvert] = useState(null);   // id du rdv dont le détail est affiché

  const charger = (date = '') => {
    setLoading(true);
    const params = date ? { date } : {};
    api.get('/medecin/rendezvous', { params }).then(res => setRdvs(res.data)).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => charger(), []);

  const toggleDetail = id => setOuvert(o => o === id ? null : id);

  const updateStatut = async (id, statut) => {
    try {
      await api.put(`/medecin/rendezvous/${id}/statut`, { statut });
      setMsg('Statut mis à jour.');
      setOuvert(null);
      charger(filtreDate);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Erreur.');
    }
  };

  return (
    <>
      <div className="mc-topbar"><h4>Mes rendez-vous</h4></div>
      <div className="mc-content">
        {msg && <div className="mc-alert mc-alert-success"><i className="bi bi-check-circle me-2"/>{msg}</div>}
        <div className="mc-table-wrap">
          <div className="mc-table-title">
            <span>Liste des rendez-vous filtrer par date</span>
            <input type="date" className="form-control" style={{ width:'auto', display:'inline-block' }}
              value={filtreDate} onChange={e => { setFiltreDate(e.target.value); charger(e.target.value); }} />
          </div>
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary"/></div>
          ) : rdvs.length === 0 ? (
            <div className="text-center py-4" style={{ color:'var(--mc-grey)' }}>
              <i className="bi bi-calendar-x" style={{ fontSize:'2rem' }}/><br/>Aucun rendez-vous trouvé.
            </div>
          ) : (
            <table className="table table-hover mb-0">
              <thead><tr>
                <th>Patient</th><th>Téléphone</th><th>Date & Heure</th>
                <th>Type</th><th>Statut</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {rdvs.map(r => (
                  <React.Fragment key={r.id}>
                    <tr style={{ cursor:'pointer' }} onClick={() => toggleDetail(r.id)}>
                      <td><i className="bi bi-person-circle me-1 text-primary"/>{r.patient?.nom}</td>
                      <td>{r.patient?.phone}</td>
                      <td>{new Date(r.date_heure).toLocaleString('fr-FR')}</td>
                      <td>
                        <span className="mc-badge" style={{ background:'#EEF2FF', color:'#3730A3', border:'1px solid #C7D2FE' }}>
                          {TYPE_LABELS[r.type_consultation] || r.type_consultation}
                        </span>
                      </td>
                      <td><BadgeStatut statut={r.statut}/></td>
                      <td>
                        <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
                          <button className="btn btn-sm btn-outline-secondary" onClick={e => { e.stopPropagation(); toggleDetail(r.id); }}>
                            <i className={`bi ${ouvert === r.id ? 'bi-chevron-up' : 'bi-eye'}`}/>
                          </button>
                          {r.statut !== 'ANNULE' && (
                            <>
                              {r.statut === 'EN_ATTENTE' && (
                                <button className="btn btn-sm btn-outline-primary" onClick={e => { e.stopPropagation(); updateStatut(r.id,'CONFIRME'); }}>
                                  Confirmer
                                </button>
                              )}
                              <button className="btn btn-sm btn-outline-danger" onClick={e => { e.stopPropagation(); updateStatut(r.id,'ANNULE'); }}>
                                Annuler
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {ouvert === r.id && (
                      <tr>
                        <td colSpan="6" style={{ background:'#F8FAFF', padding:'1.25rem 1.5rem' }}>
                          <div className="row g-3">
                            {/* Motif & Symptômes */}
                            <div className="col-md-6">
                              <strong><i className="bi bi-clipboard2-pulse me-1 text-primary"/>Motif :</strong>
                              <p style={{ margin:'0.25rem 0 0', whiteSpace:'pre-wrap' }}>{r.motif || <em style={{color:'var(--mc-grey)'}}>Non renseigné</em>}</p>
                            </div>
                            <div className="col-md-6">
                              <strong><i className="bi bi-thermometer-half me-1 text-danger"/>Symptômes :</strong>
                              <p style={{ margin:'0.25rem 0 0', whiteSpace:'pre-wrap' }}>{r.symptomes || <em style={{color:'var(--mc-grey)'}}>Non renseigné</em>}</p>
                            </div>
                            <div className="col-md-4">
                              <strong><i className="bi bi-capsule me-1 text-warning"/>Médicaments en cours :</strong>
                              <p style={{ margin:'0.25rem 0 0' }}>{r.medicaments_actuels || <em style={{color:'var(--mc-grey)'}}>Aucun</em>}</p>
                            </div>
                            <div className="col-md-4">
                              <strong><i className="bi bi-exclamation-triangle me-1 text-danger"/>Allergies :</strong>
                              <p style={{ margin:'0.25rem 0 0' }}>{r.allergies || <em style={{color:'var(--mc-grey)'}}>Aucune</em>}</p>
                            </div>
                            <div className="col-md-4">
                              <strong><i className="bi bi-file-medical me-1 text-success"/>Ordonnance précédente :</strong>
                              <p style={{ margin:'0.25rem 0 0' }}>
                                {r.ordonnance_precedente
                                  ? <span className="mc-badge badge-confirme">Oui</span>
                                  : <span className="mc-badge badge-annule">Non</span>}
                              </p>
                            </div>
                            {r.notes_patient && (
                              <div className="col-12">
                                <strong><i className="bi bi-chat-left-text me-1"/>Notes du patient :</strong>
                                <p style={{ margin:'0.25rem 0 0', whiteSpace:'pre-wrap' }}>{r.notes_patient}</p>
                              </div>
                            )}
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

// ─── Planning hebdomadaire (calendrier) ──────────────────────────────────────
function Planning() {
  const [semaine,    setSemaine]    = useState([]);   // 7 jours avec stats
  const [form,       setForm]       = useState({ jour_semaine: '0', heure_debut: '09:00', heure_fin: '17:00', max_patients_par_heure: '3' });
  const [jourActif,  setJourActif]  = useState(null); // index 0-6 du panneau ouvert
  const [modifId,    setModifId]    = useState(null); // id du créneau en cours d'édition
  const [modifForm,  setModifForm]  = useState({});
  const [msg,        setMsg]        = useState('');
  const [erreur,     setErreur]     = useState('');
  const [loading,    setLoading]    = useState(false);

  const charger = () =>
    api.get('/medecin/planning-semaine').then(res => setSemaine(res.data));

  useEffect(() => { charger(); }, []);

  const handleSubmit = async e => {
    e.preventDefault(); setMsg(''); setErreur('');
    setLoading(true);
    try {
      await api.post('/medecin/disponibilites', {
        jour_semaine:           parseInt(form.jour_semaine),
        heure_debut:            form.heure_debut,
        heure_fin:              form.heure_fin,
        max_patients_par_heure: parseInt(form.max_patients_par_heure),
      });
      setMsg('Créneau ajouté.');
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur.');
    } finally { setLoading(false); }
  };

  const supprimer = async id => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    await api.delete(`/medecin/disponibilites/${id}`);
    charger();
  };

  const ouvrirModif = creneau => {
    setModifId(creneau.id);
    setModifForm({
      heure_debut:            creneau.heure_debut,
      heure_fin:              creneau.heure_fin,
      max_patients_par_heure: String(creneau.max_patients_par_heure),
    });
  };

  const sauvegarderModif = async () => {
    setMsg(''); setErreur('');
    try {
      await api.put(`/medecin/disponibilites/${modifId}`, {
        heure_debut:            modifForm.heure_debut,
        heure_fin:              modifForm.heure_fin,
        max_patients_par_heure: parseInt(modifForm.max_patients_par_heure),
      });
      setMsg('Créneau mis à jour.');
      setModifId(null);
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur.');
    }
  };

  // Jour de la semaine actuelle
  const aujourdhuiIdx = (() => {
    const d = new Date().getDay(); // 0=Sun
    return d === 0 ? 6 : d - 1;   // 0=Mon…6=Sun
  })();

  return (
    <>
      <div className="mc-topbar"><h4>Mon planning</h4></div>
      <div className="mc-content">

        {/* ── Alerte info planification ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1rem',
          fontSize: '0.86rem', color: '#1E40AF',
        }}>
          <i className="bi bi-info-circle-fill" style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.05rem' }} />
          <div>
            <strong>Créneaux récurrents :</strong> Les disponibilités que vous définissez s'appliquent <strong>chaque semaine automatiquement</strong> — pas uniquement la semaine en cours.
            <br />
            <span style={{ opacity: 0.85 }}>
              Ex : si vous ajoutez <em>Lundi 09:00–17:00</em>, vous serez disponible tous les lundis jusqu'à ce que vous supprimiez ce créneau.
              Le calendrier ci-dessous affiche uniquement les rendez-vous programmés pour <strong>la semaine en cours</strong>.
            </span>
          </div>
        </div>

        {/* ── Calendrier hebdomadaire ── */}
        <div className="mc-table-wrap mb-4">
          <div className="mc-table-title">
            <span><i className="bi bi-calendar-week me-2 text-primary" />Vue hebdomadaire — semaine en cours</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', padding: '1rem' }}>
            {semaine.map(jour => {
              const estAujourd  = jour.jour_semaine === aujourdhuiIdx;
              const estPasse    = jour.jour_semaine < aujourdhuiIdx;
              const actif       = jour.disponible && !estPasse;
              const ouvert      = jourActif === jour.jour_semaine;

              return (
                <div key={jour.jour_semaine}
                  onClick={() => setJourActif(ouvert ? null : jour.jour_semaine)}
                  style={{
                    borderRadius: 12,
                    border: estAujourd ? '2px solid var(--mc-blue)' : '1px solid var(--mc-border)',
                    background: actif ? '#F0FDF4' : '#F9FAFB',
                    cursor: 'pointer',
                    opacity: estPasse ? 0.55 : 1,
                    transition: 'box-shadow 0.18s',
                    boxShadow: ouvert ? '0 0 0 3px rgba(37,99,235,0.18)' : undefined,
                    overflow: 'hidden',
                  }}
                >
                  {/* En-tête du jour */}
                  <div style={{
                    background: actif ? '#22c55e' : '#9CA3AF',
                    color: 'white', padding: '0.5rem 0.6rem',
                    fontWeight: 700, fontSize: '0.82rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>{jour.jour_label}</span>
                    {estAujourd && <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '0 5px' }}>Auj.</span>}
                  </div>

                  <div style={{ padding: '0.6rem' }}>
                    {jour.disponible ? (
                      <>
                        {jour.creneaux.map(c => (
                          <div key={c.id} style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, marginBottom: '0.2rem' }}>
                            <i className="bi bi-clock me-1" />{c.heure_debut}–{c.heure_fin}
                          </div>
                        ))}
                        <div style={{ fontSize: '0.73rem', color: '#6B7280', marginTop: '0.35rem' }}>
                          <i className="bi bi-people me-1" />{jour.total_patients} patient{jour.total_patients !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: jour.total_places_restantes > 0 ? '#166534' : '#991B1B', fontWeight: 600 }}>
                          <i className="bi bi-check2-circle me-1" />{jour.total_places_restantes} place{jour.total_places_restantes !== 1 ? 's' : ''} rest.
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center', padding: '0.4rem 0' }}>
                        <i className="bi bi-dash-circle" /><br />Non disponible
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Détail du jour sélectionné ── */}
        {jourActif !== null && semaine[jourActif] && (
          <div className="mc-table-wrap mb-4" style={{ border: '2px solid var(--mc-blue)' }}>
            <div className="mc-table-title" style={{ background: 'var(--mc-blue-bg)' }}>
              <span style={{ color: 'var(--mc-blue)', fontWeight: 700 }}>
                <i className="bi bi-calendar-day me-2" />{semaine[jourActif].jour_label} — {semaine[jourActif].date_display}
              </span>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setJourActif(null)}>
                <i className="bi bi-x" />
              </button>
            </div>
            <div style={{ padding: '1rem' }}>
              {msg    && <div className="mc-alert mc-alert-success">{msg}</div>}
              {erreur && <div className="mc-alert mc-alert-error">{erreur}</div>}

              {semaine[jourActif].creneaux.length === 0 ? (
                <div className="text-center py-3" style={{ color: 'var(--mc-grey)' }}>
                  <i className="bi bi-calendar-x" style={{ fontSize: '1.6rem' }} />
                  <div className="mt-1" style={{ fontSize: '0.88rem' }}>Aucun créneau ce jour — ajoutez-en un ci-dessous.</div>
                </div>
              ) : (
                <div className="row g-3">
                  {semaine[jourActif].creneaux.map(c => (
                    <div key={c.id} className="col-md-4">
                      <div style={{
                        border: '1px solid #BBF7D0', borderRadius: 10,
                        padding: '0.9rem', background: '#F0FDF4',
                      }}>
                        {modifId === c.id ? (
                          /* ── Formulaire modification ── */
                          <>
                            <div className="mb-2">
                              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Heure début</label>
                              <input type="time" className="form-control form-control-sm"
                                value={modifForm.heure_debut}
                                onChange={e => setModifForm(f => ({ ...f, heure_debut: e.target.value }))} />
                            </div>
                            <div className="mb-2">
                              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Heure fin</label>
                              <input type="time" className="form-control form-control-sm"
                                value={modifForm.heure_fin}
                                onChange={e => setModifForm(f => ({ ...f, heure_fin: e.target.value }))} />
                            </div>
                            <div className="mb-2">
                              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Max / heure</label>
                              <input type="number" className="form-control form-control-sm" min="1" max="20"
                                value={modifForm.max_patients_par_heure}
                                onChange={e => setModifForm(f => ({ ...f, max_patients_par_heure: e.target.value }))} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button className="btn btn-sm btn-success flex-fill" onClick={sauvegarderModif}>
                                <i className="bi bi-floppy me-1" />Sauvegarder
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => setModifId(null)}>
                                <i className="bi bi-x" />
                              </button>
                            </div>
                          </>
                        ) : (
                          /* ── Affichage normal ── */
                          <>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#166534', marginBottom: '0.4rem' }}>
                              <i className="bi bi-clock me-1" />{c.heure_debut} – {c.heure_fin}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#374151' }}>
                              <i className="bi bi-people me-1 text-primary" />
                              <strong>{c.patients_programmes}</strong> patient{c.patients_programmes !== 1 ? 's' : ''} programmé{c.patients_programmes !== 1 ? 's' : ''}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: c.places_restantes > 0 ? '#166534' : '#991B1B', fontWeight: 600 }}>
                              <i className="bi bi-check2-circle me-1" />
                              {c.places_restantes} / {c.capacite_totale} place{c.places_restantes !== 1 ? 's' : ''} restante{c.places_restantes !== 1 ? 's' : ''}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                              Max {c.max_patients_par_heure} patient{c.max_patients_par_heure !== 1 ? 's' : ''}/heure
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
                              <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => ouvrirModif(c)}>
                                <i className="bi bi-pencil me-1" />Modifier
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => supprimer(c.id)}>
                                <i className="bi bi-trash" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Formulaire ajout créneau ── */}
        <div className="mc-table-wrap">
          <div className="mc-table-title">
            <span><i className="bi bi-plus-circle me-2 text-primary" />Ajouter un créneau</span>
          </div>
          <div style={{ padding: '1rem' }}>
            {!msg && erreur && <div className="mc-alert mc-alert-error">{erreur}</div>}
            {!erreur && msg  && <div className="mc-alert mc-alert-success">{msg}</div>}
            <form onSubmit={handleSubmit}>
              <div className="row g-3 align-items-end">
                <div className="col-sm-3">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Jour</label>
                  <select className="form-control form-control-sm" value={form.jour_semaine}
                    onChange={e => setForm({ ...form, jour_semaine: e.target.value })}>
                    {JOURS.map((j, i) => <option key={i} value={i}>{j}</option>)}
                  </select>
                </div>
                <div className="col-sm-2">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Début</label>
                  <input type="time" className="form-control form-control-sm" value={form.heure_debut}
                    onChange={e => setForm({ ...form, heure_debut: e.target.value })} />
                </div>
                <div className="col-sm-2">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fin</label>
                  <input type="time" className="form-control form-control-sm" value={form.heure_fin}
                    onChange={e => setForm({ ...form, heure_fin: e.target.value })} />
                </div>
                <div className="col-sm-2">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Max / heure</label>
                  <input type="number" className="form-control form-control-sm" min="1" max="20"
                    value={form.max_patients_par_heure}
                    onChange={e => setForm({ ...form, max_patients_par_heure: e.target.value })} />
                </div>
                <div className="col-sm-3">
                  <button type="submit" className="btn btn-primary btn-sm w-100" disabled={loading}>
                    {loading
                      ? <span className="spinner-border spinner-border-sm" />
                      : <><i className="bi bi-plus-lg me-1" />Ajouter le créneau</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>
    </>
  );
}

// ─── Dashboard Médecin (layout) ────────────────────────────────────────────────
export default function MedecinDashboard() {
  return (
    <div className="mc-layout">
      <Sidebar title="Médecin" links={LINKS} />
      <main className="mc-main">
        <Routes>
          <Route index           element={<Accueil />} />
          <Route path="rdv"      element={<MesRdv />} />
          <Route path="planning" element={<Planning />} />
        </Routes>
        <Footer />
      </main>
    </div>
  );
}

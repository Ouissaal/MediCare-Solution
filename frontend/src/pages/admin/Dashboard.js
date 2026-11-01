import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import api from '../../services/api';

const LINKS = [
  { to: '/admin',           icon: 'bi-grid-fill',      label: 'Tableau de bord', end: true },
  { to: '/admin/medecins',  icon: 'bi-person-badge',   label: 'Médecins' },
  { to: '/admin/rdv',       icon: 'bi-calendar2-check',label: 'Rendez-vous' },
  { to: '/admin/users',     icon: 'bi-people',         label: 'Utilisateurs' },
];

function BadgeStatut({ statut }) {
  const map = {
    EN_ATTENTE: { cls:'badge-en-attente', label:'En attente' },
    CONFIRME:   { cls:'badge-confirme',   label:'Confirmé'   },
    ANNULE:     { cls:'badge-annule',     label:'Annulé'     },
  };
  const b = map[statut] || { cls:'', label:statut };
  return <span className={`mc-badge ${b.cls}`}>{b.label}</span>;
}

// ─── Accueil Admin ─────────────────────────────────────────────────────────────
function Accueil() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data));
  }, []);

  const STATS_CARDS = stats ? [
    { icon:'bi-people-fill',       color:'blue',   val:stats.total_patients,         label:'Total patients' },
    { icon:'bi-person-badge-fill', color:'green',  val:stats.total_medecins,         label:'Total médecins' },
    { icon:'bi-calendar-check',    color:'orange', val:stats.rendezvous_aujourd_hui, label:"RDV aujourd'hui" },
    { icon:'bi-x-circle-fill',     color:'red',    val:stats.rendezvous_annules,     label:'RDV annulés' },
    { icon:'bi-hourglass-split',   color:'blue',   val:stats.rendezvous_en_attente,  label:'En attente' },
    { icon:'bi-check-circle-fill', color:'green',  val:stats.rendezvous_confirmes,   label:'Confirmés' },
  ] : [];

  return (
    <>
      <div className="mc-topbar">
        <h4>Tableau de bord</h4>
        <span className="date"><i className="bi bi-calendar3 me-1"/>{today}</span>
      </div>
      <div className="mc-content">
        <div className="mc-welcome">
          <h3>Bonjour, {user?.nom} </h3>
          <p>Panneau d'administration — MediCare Solutions.</p>
        </div>
        {!stats ? (
          <div className="text-center py-4"><div className="spinner-border text-primary"/></div>
        ) : (
          <div className="row g-3">
            {STATS_CARDS.map((s, i) => (
              <div className="col-md-4 col-6" key={i}>
                <div className="mc-stat">
                  <div className={`stat-icon ${s.color}`}><i className={`bi ${s.icon}`}/></div>
                  <div>
                    <div className="stat-value">{s.val}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Gestion médecins ──────────────────────────────────────────────────────────
function Medecins() {
  const [medecins,  setMedecins]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ nom:'', email:'', phone:'', password:'', specialite:'' });
  const [msg,       setMsg]       = useState('');
  const [erreur,    setErreur]    = useState('');
  const [saving,    setSaving]    = useState(false);

  const charger = () => {
    setLoading(true);
    api.get('/admin/medecins').then(res => setMedecins(res.data)).finally(() => setLoading(false));
  };
  useEffect(charger, []);

  const handleSubmit = async e => {
    e.preventDefault(); 
    setMsg(''); 
    setErreur('');
    setSaving(true);
    try {
      await api.post('/admin/medecins', form);
      setMsg('Médecin créé avec succès.');
      setForm({ nom:'', email:'', phone:'', password:'', specialite:'' });
      setShowForm(false);
      charger();
    } catch (err) {
      const msgs = Object.values(err.response?.data?.errors || {}).flat();
      setErreur(msgs[0] || err.response?.data?.message || 'Erreur.');
    } finally { setSaving(false); }
  };

  const supprimer = async id => {
    if (!window.confirm('Supprimer ce médecin définitivement ?')) return;
    try {
      await api.delete(`/admin/medecins/${id}`);
      setMsg('Médecin supprimé.');
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur.');
    }
  };

  return (
    <>
      <div className="mc-topbar"><h4>Gestion des médecins</h4></div>
      <div className="mc-content">
        {msg    && <div className="mc-alert mc-alert-success"><i className="bi bi-check-circle me-2"/>{msg}</div>}
        {erreur && <div className="mc-alert mc-alert-error"><i className="bi bi-exclamation-circle me-2"/>{erreur}</div>}

        {/* Formulaire création */}
        {showForm && (
          <div className="mc-table-wrap p-4 mb-4">
            <h6 style={{ fontWeight:700, marginBottom:'1rem' }}>Nouveau médecin</h6>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6"><div className="mc-input-group">
                  <label>Nom complet</label>
                  <input className="form-control" value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} placeholder="Dr. Martin"/>
                </div></div>
                <div className="col-md-6"><div className="mc-input-group">
                  <label>Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="martin@clinic.com"/>
                </div></div>
                <div className="col-md-6"><div className="mc-input-group">
                  <label>Téléphone</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="0677889900"/>
                </div></div>
                <div className="col-md-6"><div className="mc-input-group">
                  <label>Mot de passe</label>
                  <input type="password" className="form-control" value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="••••••••"/>
                </div></div>
                <div className="col-md-6"><div className="mc-input-group">
                  <label>Spécialité</label>
                  <input className="form-control" value={form.specialite} onChange={e => setForm({...form, specialite:e.target.value})} placeholder="Cardiologie"/>
                </div></div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
                <button type="submit" className="mc-btn mc-btn-primary" style={{ width:'auto', padding:'0.65rem 1.5rem' }} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm"/> : <><i className="bi bi-plus-lg me-1"/>Créer</>}
                </button>
                <button type="button" className="mc-btn mc-btn-outline" style={{ width:'auto', padding:'0.65rem 1.25rem' }} onClick={() => setShowForm(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mc-table-wrap">
          <div className="mc-table-title">
            Liste des médecins
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
              <i className="bi bi-plus-lg me-1"/>{showForm ? 'Fermer' : 'Ajouter un médecin'}
            </button>
          </div>
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary"/></div>
          ) : medecins.length === 0 ? (
            <div className="text-center py-4" style={{ color:'var(--mc-grey)' }}>Aucun médecin enregistré.</div>
          ) : (
            <table className="table table-hover mb-0">
              <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Spécialité</th><th>Statut</th><th>Action</th></tr></thead>
              <tbody>
                {medecins.map(m => (
                  <tr key={m.id}>
                    <td><i className="bi bi-person-badge me-1 text-primary"/>{m.nom}</td>
                    <td>{m.email}</td>
                    <td>{m.phone}</td>
                    <td>{m.specialite}</td>
                    <td>
                      <span className={`mc-badge ${m.actif ? 'badge-confirme' : 'badge-annule'}`}>
                        {m.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => supprimer(m.id)}>
                        <i className="bi bi-trash"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Tous les rendez-vous ─────────────────────────────────────────────────────
function TousRdv() {
  const [rdvs,    setRdvs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');
  const [filtres, setFiltres] = useState({ date:'', statut:'' });

  const charger = (f = filtres) => {
    setLoading(true);
    const params = {};
    if (f.date)   params.date   = f.date;
    if (f.statut) params.statut = f.statut;
    api.get('/admin/rendezvous', { params }).then(res => setRdvs(res.data)).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => charger(), []);

  const annuler = async id => {
    if (!window.confirm('Annuler ce rendez-vous ?')) return;
    try {
      await api.put(`/admin/rendezvous/${id}/annuler`);
      setMsg('Rendez-vous annulé.');
      charger();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Erreur.');
    }
  };

  const handleFiltre = (key, val) => {
    const f = { ...filtres, [key]: val };
    setFiltres(f);
    charger(f);
  };

  return (
    <>
      <div className="mc-topbar"><h4>Tous les rendez-vous</h4></div>
      <div className="mc-content">
        {msg && <div className="mc-alert mc-alert-success"><i className="bi bi-check-circle me-2"/>{msg}</div>}
        <div className="mc-table-wrap">
          <div className="mc-table-title" style={{ flexWrap:'wrap', gap:'0.5rem' }}>
            <span>Rendez-vous ({rdvs.length})</span>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              <input type="date" className="form-control form-control-sm" style={{ width:'auto' }}
                value={filtres.date} onChange={e => handleFiltre('date', e.target.value)}/>
              <select className="form-control form-control-sm" style={{ width:'auto' }}
                value={filtres.statut} onChange={e => handleFiltre('statut', e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="CONFIRME">Confirmé</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary"/></div>
          ) : rdvs.length === 0 ? (
            <div className="text-center py-4" style={{ color:'var(--mc-grey)' }}>Aucun rendez-vous trouvé.</div>
          ) : (
            <table className="table table-hover mb-0">
              <thead><tr><th>Patient</th><th>Médecin</th><th>Spécialité</th><th>Date & Heure</th><th>Statut</th><th>Action</th></tr></thead>
              <tbody>
                {rdvs.map(r => (
                  <tr key={r.id}>
                    <td>{r.patient?.nom}</td>
                    <td>{r.medecin?.nom}</td>
                    <td>{r.medecin?.specialite}</td>
                    <td>{new Date(r.date_heure).toLocaleString('fr-FR')}</td>
                    <td><BadgeStatut statut={r.statut}/></td>
                    <td>
                      {r.statut !== 'ANNULE' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => annuler(r.id)}>
                          <i className="bi bi-x-circle me-1"/>Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Gestion utilisateurs ─────────────────────────────────────────────────────
function Utilisateurs() {
  const { user: moi } = useAuth();
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [msg,      setMsg]      = useState('');
  const [filtre,   setFiltre]   = useState('');
  // { id, role, specialite } — utilisateur dont on modifie le rôle
  const [editRole, setEditRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const charger = (role = '') => {
    setLoading(true);
    const params = role ? { role } : {};
    api.get('/admin/utilisateurs', { params }).then(res => setUsers(res.data)).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => charger(), []);

  const toggle = async id => {
    try {
      const res = await api.put(`/admin/utilisateurs/${id}/toggle-actif`);
      setMsg(res.data.message);
      charger(filtre);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Erreur.');
    }
  };

  const soumettreRole = async () => {
    if (!editRole) return;
    setRoleLoading(true);
    setMsg('');
    try {
      const payload = { role: editRole.role };
      if (editRole.role === 'medecin') payload.specialite = editRole.specialite;
      const res = await api.put(`/admin/utilisateurs/${editRole.id}/role`, payload);
      setMsg(res.data.message);
      setEditRole(null);
      charger(filtre);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Erreur.');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleFiltre = v => { setFiltre(v); charger(v); };

  return (
    <>
      <div className="mc-topbar"><h4>Gestion des utilisateurs</h4></div>
      <div className="mc-content">
        {msg && <div className="mc-alert mc-alert-success"><i className="bi bi-check-circle me-2"/>{msg}</div>}
        <div className="mc-table-wrap">
          <div className="mc-table-title" style={{ flexWrap:'wrap', gap:'0.5rem' }}>
            <span>Utilisateurs ({users.length})</span>
            <select className="form-control form-control-sm" style={{ width:'auto' }}
              value={filtre} onChange={e => handleFiltre(e.target.value)}>
              <option value="">Tous les rôles</option>
              <option value="patient">Patients</option>
              <option value="medecin">Médecins</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary"/></div>
          ) : (
            <table className="table table-hover mb-0">
              <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <React.Fragment key={u.id}>
                    <tr>
                      <td><i className="bi bi-person me-1 text-primary"/>{u.nom}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="mc-badge" style={{ background:'var(--mc-blue-bg)', color:'var(--mc-blue)', border:'1px solid #85C79A' }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`mc-badge ${u.actif ? 'badge-confirme' : 'badge-annule'}`}>
                          {u.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        {u.id !== moi?.id && (
                          <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
                            {/* Activer / Désactiver */}
                            <button className={`btn btn-sm ${u.actif ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              onClick={() => toggle(u.id)}>
                              {u.actif
                                ? <><i className="bi bi-ban me-1"/>Désactiver</>
                                : <><i className="bi bi-check-circle me-1"/>Activer</>}
                            </button>
                            {/* Modifier le rôle */}
                            <button className="btn btn-sm btn-outline-warning"
                              title="Modifier le rôle"
                              onClick={() => editRole?.id === u.id
                                ? setEditRole(null)
                                : setEditRole({ id: u.id, role: u.role, specialite: '' })}>
                              <i className={`bi ${editRole?.id === u.id ? 'bi-chevron-up' : 'bi-person-gear'}`}/>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* ── Formulaire changement de rôle ── */}
                    {editRole?.id === u.id && (
                      <tr>
                        <td colSpan="5" style={{ background:'#FFFBEB', padding:'1rem 1.5rem' }}>
                          <strong style={{ color:'var(--mc-blue)' }}>
                            <i className="bi bi-person-gear me-2"/>Modifier le rôle de <em>{u.nom}</em>
                          </strong>
                          <div className="row g-3 mt-1 align-items-end">
                            <div className="col-md-4">
                              <label className="form-label" style={{ fontSize:'0.85rem', fontWeight:600 }}>Nouveau rôle</label>
                              <select className="form-control form-control-sm"
                                value={editRole.role}
                                onChange={e => setEditRole(r => ({ ...r, role: e.target.value, specialite: '' }))}>
                                <option value="patient">Patient</option>
                                <option value="medecin">Médecin</option>
                                <option value="admin">Administrateur</option>
                              </select>
                            </div>
                            {editRole.role === 'medecin' && (
                              <div className="col-md-4">
                                <label className="form-label" style={{ fontSize:'0.85rem', fontWeight:600 }}>Spécialité <span style={{color:'red'}}>*</span></label>
                                <input type="text" className="form-control form-control-sm"
                                  placeholder="Ex : Cardiologie"
                                  value={editRole.specialite}
                                  onChange={e => setEditRole(r => ({ ...r, specialite: e.target.value }))} />
                              </div>
                            )}
                            <div className="col-md-4">
                              <div style={{ display:'flex', gap:'0.5rem' }}>
                                <button className="btn btn-sm btn-primary" disabled={roleLoading}
                                  onClick={soumettreRole}>
                                  {roleLoading
                                    ? <><span className="spinner-border spinner-border-sm me-1"/>Enregistrement…</>
                                    : <><i className="bi bi-floppy me-1"/>Confirmer</>}
                                </button>
                                <button className="btn btn-sm btn-outline-secondary"
                                  onClick={() => setEditRole(null)}>
                                  Annuler
                                </button>
                              </div>
                            </div>
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

// ─── Dashboard Admin (layout) ──────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <div className="mc-layout">
      <Sidebar title="Admin" links={LINKS} />
      <main className="mc-main">
        <Routes>
          <Route index            element={<Accueil />} />
          <Route path="medecins"  element={<Medecins />} />
          <Route path="rdv"       element={<TousRdv />} />
          <Route path="users"     element={<Utilisateurs />} />
        </Routes>
        <Footer />
      </main>
    </div>
  );
}

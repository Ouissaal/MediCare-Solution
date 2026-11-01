import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [nonLues,       setNonLues]       = useState(0);
  const [ouvert,        setOuvert]        = useState(false);
  const [apercu,        setApercu]        = useState(null); // dernière notif non lue
  const [showApercu,    setShowApercu]    = useState(false);
  const ref = useRef(null);

  const charger = () => {
    api.get('/notifications').then(res => {
      const data      = res.data.notifications;
      const newNonLues = res.data.non_lues;

      // Affiche aperçu si nouvelle notification non lue arrive
      if (newNonLues > nonLues && data.length > 0) {
        const derniere = data.find(n => !n.lu);
        if (derniere) {
          setApercu(derniere);
          setShowApercu(true);
          setTimeout(() => setShowApercu(false), 4000);
        }
      }

      setNotifications(data);
      setNonLues(newNonLues);
    }).catch(() => {});
  };

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fermer dropdown si clic en dehors
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const marquerLue = async id => {
    await api.put(`/notifications/${id}/lire`);
    charger();
  };

  const toutLire = async () => {
    await api.put('/notifications/tout-lire');
    charger();
  };

  const iconType = type => ({
    success: { cls: 'bi-check-circle-fill', color: '#22c55e' },
    warning: { cls: 'bi-x-circle-fill',     color: '#ef4444' },
    info:    { cls: 'bi-info-circle-fill',   color: '#3b82f6' },
  }[type] || { cls: 'bi-bell-fill', color: '#94a3b8' });

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Aperçu toast (nouvelle notif) ── */}
      {showApercu && apercu && (
        <div style={{
          position: 'absolute', top: 42, right: 0,
          background: 'white', borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          padding: '0.75rem 1rem', width: 260,
          border: `2px solid ${iconType(apercu.type).color}`,
          zIndex: 999, animation: 'fadeIn 0.3s ease',
          display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
        }}>
          <i className={`bi ${iconType(apercu.type).cls}`}
            style={{ color: iconType(apercu.type).color, fontSize: '1.1rem', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.8rem', color: '#1e293b', lineHeight: 1.4 }}>{apercu.message}</div>
          </div>
        </div>
      )}

      {/* ── Bouton cloche ── */}
      <button
        onClick={() => { setOuvert(o => !o); setShowApercu(false); }}
        style={{
          position: 'relative', background: nonLues > 0 ? '#fef9c3' : '#f1f5f9',
          border: 'none', borderRadius: 10,
          padding: '0.45rem 0.75rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          transition: 'background 0.2s',
        }}
      >
        <i className="bi bi-bell-fill" style={{ fontSize: '1.1rem', color: nonLues > 0 ? '#f59e0b' : '#64748b' }} />
        {nonLues > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#ef4444', color: 'white',
            fontSize: '0.62rem', fontWeight: 800,
            borderRadius: '50%', width: 17, height: 17,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 2px white',
          }}>
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
        {nonLues > 0 && (
          <span style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 700 }}>
            {nonLues} nouvelle{nonLues > 1 ? 's' : ''}
          </span>
        )}
      </button>

      {/* ── Dropdown notifications ── */}
      {ouvert && (
        <div style={{
          position: 'absolute', top: 42, right: 0,
          width: 320, background: 'white', borderRadius: 14,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          zIndex: 1000, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
              <i className="bi bi-bell me-2 text-primary" />Notifications
              {nonLues > 0 && (
                <span style={{ marginLeft: '0.5rem', background: '#ef4444', color: 'white', borderRadius: 10, padding: '0.1rem 0.45rem', fontSize: '0.72rem' }}>
                  {nonLues}
                </span>
              )}
            </span>
            {nonLues > 0 && (
              <button onClick={toutLire} style={{ background: 'none', border: 'none', color: '#4E8D9C', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                Tout lire
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                <i className="bi bi-bell-slash" style={{ fontSize: '1.5rem' }} /><br />
                <span style={{ fontSize: '0.85rem' }}>Aucune notification</span>
              </div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.lu && marquerLue(n.id)}
                style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  padding: '0.85rem 1rem',
                  background: n.lu ? 'white' : '#f0f9ff',
                  borderBottom: '1px solid #f8fafc',
                  cursor: n.lu ? 'default' : 'pointer',
                }}
              >
                <i className={`bi ${iconType(n.type).cls}`}
                  style={{ color: iconType(n.type).color, fontSize: '1.1rem', marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    {new Date(n.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
                {!n.lu && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 5 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

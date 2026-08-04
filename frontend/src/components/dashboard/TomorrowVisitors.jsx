import { useState, useEffect } from 'react';

export default function TomorrowVisitors({ onAddVisit }) {
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    fetch('/api/visits/tomorrow', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVisits(data);
        } else {
          setVisits([]);
        }
      })
      .catch((err) => {
        console.error('Visits fetch error:', err);
        setVisits([]);
      });
  }, []);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1.5px solid #3B82F6',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E40AF', margin: 0 }}>📅 Tomorrow's Visitors</h3>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{tomorrowStr}</p>
        </div>
        <button
          onClick={onAddVisit}
          style={{
            background: '#3B82F6',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Visitor
        </button>
      </div>

      {visits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 32 }}>🏪</div>
          <p style={{ fontSize: 13, marginTop: 8 }}>No visitors scheduled for tomorrow</p>
        </div>
      ) : (
        visits.map((v) => (
          <div
            key={v.id}
            style={{
              display: 'flex',
              gap: 12,
              padding: '12px 0',
              borderBottom: '1px solid #F3F4F6',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                background: '#DBEAFE',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                color: '#1E40AF',
              }}
            >
              {(v.visitor_name || v.lead_name)[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{v.visitor_name || v.lead_name}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                {v.visit_time && <span>🕐 {v.visit_time} &nbsp;·&nbsp;</span>}
                {v.visit_purpose && <span>{v.visit_purpose}</span>}
              </div>
              {v.machines_interested && (
                <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 3 }}>Machine: {v.machines_interested}</div>
              )}
            </div>
            <a
              href={`tel:+91${v.visitor_phone || v.lead_phone}`}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              📞
            </a>
          </div>
        ))
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';

export default function VIPCustomers() {
  const [vips, setVips] = useState([]);

  useEffect(() => {
    fetch('/api/leads/vip', {
      headers: { Authorization: `Bearer ${localStorage.getItem('crm_token')}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVips(data);
        } else {
          setVips([]);
        }
      })
      .catch((err) => {
        console.error('VIP fetch error:', err);
        setVips([]);
      });
  }, []);

  if (vips.length === 0) return null;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1.5px solid #F59E0B',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#92400E', margin: 0 }}>
          ⭐ VIP Customers ({vips.length})
        </h3>
        <a href="/leads?filter=vip" style={{ fontSize: 12, color: '#E8500A', fontWeight: 600 }}>
          View all
        </a>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}
      >
        {vips.map((v) => (
          <div
            key={v.id}
            style={{
              minWidth: 180,
              background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
              border: '1px solid #F59E0B',
              borderRadius: 14,
              padding: 14,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: '#F59E0B',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {v.name[0]}
              </div>
              <span style={{ fontSize: 16 }}>⭐</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{v.name}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>📍 {v.city || '—'}</div>
            {v.vip_note && (
              <div
                style={{
                  fontSize: 11,
                  color: '#92400E',
                  marginTop: 6,
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                }}
              >
                "{v.vip_note}"
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <a
                href={`tel:+91${v.phone}`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '6px',
                  borderRadius: 8,
                  background: '#DCFCE7',
                  fontSize: 16,
                  textDecoration: 'none',
                }}
              >
                📞
              </a>
              <a
                href={`https://wa.me/91${v.phone}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '6px',
                  borderRadius: 8,
                  background: '#DCFCE7',
                  fontSize: 16,
                  textDecoration: 'none',
                }}
              >
                💬
              </a>
              <a
                href={`/leads/${v.id}`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '6px',
                  borderRadius: 8,
                  background: '#EDE9FE',
                  fontSize: 16,
                  textDecoration: 'none',
                }}
              >
                👁️
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

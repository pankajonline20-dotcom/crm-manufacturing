import { useState, useEffect } from 'react';
import SimpleAddContactModal from '../components/directory/SimpleAddContactModal';

const TABS = [
  { key: 'all', label: 'All', emoji: '📋', color: '#6B7280' },
  { key: 'customer', label: 'Customers', emoji: '👤', color: '#1B3A6B' },
  { key: 'engineer', label: 'Engineers', emoji: '🔧', color: '#0F6E56' },
  { key: 'dealer', label: 'Dealers', emoji: '🏪', color: '#534AB7' },
  { key: 'supplier', label: 'Suppliers', emoji: '📦', color: '#854F0B' },
];

const typeConfig = {
  customer: { emoji: '👤', color: '#1B3A6B', bg: '#EEF2FF' },
  engineer: { emoji: '🔧', color: '#0F6E56', bg: '#E1F5EE' },
  dealer: { emoji: '🏪', color: '#534AB7', bg: '#EEEDFE' },
  supplier: { emoji: '📦', color: '#854F0B', bg: '#FAEEDA' },
};

export default function Directory() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [isAdmin] = useState(localStorage.getItem('role') === 'admin');

  useEffect(() => {
    const typeParam = tab === 'all' ? '' : tab;
    const params = new URLSearchParams();
    if (typeParam) params.append('type', typeParam);
    if (search) params.append('q', search);
    if (cityFilter) params.append('city', cityFilter);

    fetch(`/api/directory?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setContacts(data);
        } else {
          setContacts([]);
        }
      })
      .catch((err) => {
        console.error('Directory fetch error:', err);
        setContacts([]);
      });
  }, [tab, search, cityFilter]);

  const cities = [...new Set(contacts.map((c) => c.city).filter(Boolean))].sort();

  return (
    <div style={{ background: '#F4F5F7', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Contact Directory</h1>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: '#E8500A',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            + Add Contact
          </button>
        </div>

        <div
          style={{
            background: '#F4F5F7',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          🔍
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, ref number, city..."
            style={{
              border: 'none',
              background: 'none',
              outline: 'none',
              flex: 1,
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: 'none',
                flexShrink: 0,
                background: tab === t.key ? t.color : '#F3F4F6',
                color: tab === t.key ? '#fff' : '#6B7280',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {cities.length > 0 && (
        <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button
            onClick={() => setCityFilter('')}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: 'none',
              background: !cityFilter ? '#1B3A6B' : '#fff',
              color: !cityFilter ? '#fff' : '#6B7280',
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            All Cities
          </button>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setCityFilter(city === cityFilter ? '' : city)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: 'none',
                background: cityFilter === city ? '#1B3A6B' : '#fff',
                color: cityFilter === city ? '#fff' : '#6B7280',
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {city}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: 16 }}>
        {contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>No contacts found</div>
        ) : (
          contacts.map((c) => <DirectoryCard key={c.id} contact={c} />)
        )}
      </div>

      <SimpleAddContactModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={() => {
          setShowAdd(false);
          // Refresh contacts
          const typeParam = tab === 'all' ? '' : tab;
          const params = new URLSearchParams();
          if (typeParam) params.append('type', typeParam);
          if (search) params.append('q', search);
          if (cityFilter) params.append('city', cityFilter);
          fetch(`/api/directory?${params.toString()}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          })
            .then((r) => r.json())
            .then(setContacts)
            .catch(console.error);
        }}
      />
    </div>
  );
}

function DirectoryCard({ contact: c }) {
  const cfg = typeConfig[c.contact_type] || typeConfig.customer;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            background: cfg.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {cfg.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{c.name}</div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 10,
                background: cfg.bg,
                color: cfg.color,
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              {c.contact_type.toUpperCase()}
            </span>
          </div>

          {c.company_name && <div style={{ fontSize: 12, color: '#6B7280' }}>{c.company_name}</div>}
          {c.city && <div style={{ fontSize: 12, color: '#6B7280' }}>📍 {c.city}{c.state ? `, ${c.state}` : ''}</div>}

          {c.contact_type === 'customer' && c.customer_ref_number && (
            <div style={{ fontSize: 12, color: cfg.color, fontWeight: 600, marginTop: 4 }}>
              Ref: #{c.customer_ref_number}
            </div>
          )}
          {c.contact_type === 'customer' && c.machines_owned?.length > 0 && (
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
              Machines: {c.machines_owned.map((m) => m.machine_model).join(', ')}
            </div>
          )}

          {c.contact_type === 'engineer' && c.engineer_specialization && (
            <div style={{ fontSize: 12, color: cfg.color, marginTop: 4 }}>🔧 {c.engineer_specialization}</div>
          )}

          {c.contact_type === 'dealer' && c.dealer_territory && (
            <div style={{ fontSize: 12, color: cfg.color, marginTop: 4 }}>📍 Covers: {c.dealer_territory}</div>
          )}

          {c.contact_type === 'supplier' && c.supplier_materials && (
            <div style={{ fontSize: 12, color: cfg.color, marginTop: 4 }}>📦 Supplies: {c.supplier_materials}</div>
          )}

          {c.notes && (
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' }}>{c.notes}</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {c.phone && (
          <a
            href={`tel:+91${c.phone}`}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 8,
              background: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              color: '#0F6E56',
            }}
          >
            📞 Call
          </a>
        )}
        {c.phone && (
          <a
            href={`https://wa.me/91${c.phone}`}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              height: 36,
              borderRadius: 8,
              background: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              color: '#25D366',
            }}
          >
            💬 WhatsApp
          </a>
        )}
        {c.phone_2 && (
          <a
            href={`tel:+91${c.phone_2}`}
            style={{
              height: 36,
              borderRadius: 8,
              background: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 12px',
              textDecoration: 'none',
              fontSize: 12,
              color: '#6B7280',
            }}
          >
            📞2
          </a>
        )}
      </div>
    </div>
  );
}

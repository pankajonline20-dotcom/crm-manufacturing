import { useState } from 'react';
import BottomSheet from '../../components/ui/BottomSheet';

const CONTACT_TYPES = [
  { key: 'customer', label: 'Customer', emoji: '👤' },
  { key: 'engineer', label: 'Engineer', emoji: '🔧' },
  { key: 'dealer', label: 'Dealer', emoji: '🏪' },
  { key: 'supplier', label: 'Supplier', emoji: '📦' },
];

export default function AddContactModal({ open, onClose, defaultType = 'customer' }) {
  const [type, setType] = useState(defaultType);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    phone_2: '',
    email: '',
    city: '',
    company_name: '',
    customer_ref_number: '',
    machines_owned: [],
    engineer_specialization: '',
    engineer_availability: '',
    dealer_territory: '',
    dealer_commission_pct: '',
    supplier_materials: '',
    supplier_lead_time: '',
    notes: '',
  });
  const [newMachine, setNewMachine] = useState({ machine_model: '', serial_number: '', purchase_date: '' });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ contact_type: type, ...form }),
      });
      if (res.ok) {
        onClose();
      }
    } catch (err) {
      console.error('Add contact error:', err);
    }
    setSaving(false);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Directory Contact">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {CONTACT_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 10,
              border: 'none',
              background: type === t.key ? '#1B3A6B' : '#F3F4F6',
              color: type === t.key ? '#fff' : '#6B7280',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.emoji}
            <br />
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Name *</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone *</label>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Primary number" type="tel" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Alt. Phone</label>
          <input value={form.phone_2} onChange={(e) => setForm((f) => ({ ...f, phone_2: e.target.value }))} placeholder="Second number" type="tel" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>City</label>
          <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="e.g. Surat" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Company / Firm</label>
          <input value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} placeholder="Company name" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
      </div>

      {type === 'customer' && (
        <>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Customer Ref. Number</label>
            <input value={form.customer_ref_number} onChange={(e) => setForm((f) => ({ ...f, customer_ref_number: e.target.value }))} placeholder="e.g. CLB-2024-001" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Machines owned by this customer</label>
            {form.machines_owned.map((m, i) => (
              <div
                key={i}
                style={{
                  background: '#F9FAFB',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginTop: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.machine_model}</div>
                  {m.serial_number && <div style={{ fontSize: 11, color: '#6B7280' }}>S/N: {m.serial_number}</div>}
                  {m.purchase_date && <div style={{ fontSize: 11, color: '#6B7280' }}>Purchased: {m.purchase_date}</div>}
                </div>
                <button
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      machines_owned: f.machines_owned.filter((_, j) => j !== i),
                    }))
                  }
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
              <input
                placeholder="Model"
                value={newMachine.machine_model}
                onChange={(e) => setNewMachine((m) => ({ ...m, machine_model: e.target.value }))}
                style={{
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  padding: '8px 10px',
                  fontSize: 12,
                }}
              />
              <input
                placeholder="Serial No."
                value={newMachine.serial_number}
                onChange={(e) => setNewMachine((m) => ({ ...m, serial_number: e.target.value }))}
                style={{
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  padding: '8px 10px',
                  fontSize: 12,
                }}
              />
              <button
                onClick={() => {
                  if (newMachine.machine_model) {
                    setForm((f) => ({
                      ...f,
                      machines_owned: [...f.machines_owned, newMachine],
                    }));
                    setNewMachine({ machine_model: '', serial_number: '', purchase_date: '' });
                  }
                }}
                style={{
                  borderRadius: 8,
                  border: '1px solid #3B82F6',
                  background: '#3B82F6',
                  color: '#fff',
                  padding: '8px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>
          </div>
        </>
      )}

      {type === 'engineer' && (
        <>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Specialization</label>
            <input value={form.engineer_specialization} onChange={(e) => setForm((f) => ({ ...f, engineer_specialization: e.target.value }))} placeholder="e.g. Heat Press, CNC, All machines" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Availability</label>
            <input value={form.engineer_availability} onChange={(e) => setForm((f) => ({ ...f, engineer_availability: e.target.value }))} placeholder="e.g. Mon-Sat 9AM-6PM" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
        </>
      )}

      {type === 'dealer' && (
        <>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Territory/Region</label>
            <input value={form.dealer_territory} onChange={(e) => setForm((f) => ({ ...f, dealer_territory: e.target.value }))} placeholder="Cities/regions covered" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Commission %</label>
            <input value={form.dealer_commission_pct} onChange={(e) => setForm((f) => ({ ...f, dealer_commission_pct: e.target.value }))} placeholder="e.g. 10" type="number" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
        </>
      )}

      {type === 'supplier' && (
        <>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>What They Supply</label>
            <input value={form.supplier_materials} onChange={(e) => setForm((f) => ({ ...f, supplier_materials: e.target.value }))} placeholder="e.g. Ink, Heat tape, spare parts" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Typical Lead Time</label>
            <input value={form.supplier_lead_time} onChange={(e) => setForm((f) => ({ ...f, supplier_lead_time: e.target.value }))} placeholder="e.g. 2-3 days" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
        </>
      )}

      <div style={{ marginTop: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any additional info..." style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} />
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          width: '100%',
          height: 50,
          marginTop: 16,
          borderRadius: 12,
          background: saving ? '#9CA3AF' : '#1B3A6B',
          color: '#fff',
          border: 'none',
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        {saving ? 'Adding...' : '+ Add to Directory'}
      </button>
    </BottomSheet>
  );
}

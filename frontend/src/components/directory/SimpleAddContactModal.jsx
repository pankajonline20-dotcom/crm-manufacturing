import { useState } from 'react';
import BottomSheet from '../../components/ui/BottomSheet';

export default function SimpleAddContactModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    contact_type: 'customer',
    name: '',
    phone: '',
    city: '',
    machines_owned: [],
    supplier_materials: '',
  });
  const [newMachine, setNewMachine] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name || !form.phone) {
      alert('Name and Phone are required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        contact_type: form.contact_type,
        name: form.name,
        phone: form.phone,
        city: form.city,
      };

      if (form.contact_type === 'customer' && form.machines_owned.length > 0) {
        body.machines_owned = form.machines_owned.map(m => ({ machine_model: m }));
      }

      if (form.contact_type === 'supplier' && form.supplier_materials) {
        body.supplier_materials = form.supplier_materials;
      }

      const res = await fetch('/api/directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onSave?.();
        setForm({ contact_type: 'customer', name: '', phone: '', city: '', machines_owned: [], supplier_materials: '' });
        onClose();
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setSaving(false);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Contact">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Contact Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['customer', 'supplier', 'engineer', 'dealer'].map((type) => (
              <button
                key={type}
                onClick={() => setForm((f) => ({ ...f, contact_type: type }))}
                style={{
                  padding: '10px',
                  borderRadius: 8,
                  border: form.contact_type === type ? '2px solid #1B3A6B' : '1px solid #E5E7EB',
                  background: form.contact_type === type ? '#EEF2FF' : '#fff',
                  color: form.contact_type === type ? '#1B3A6B' : '#6B7280',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Customer name"
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              padding: '10px 12px',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone Number *</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="9876543210"
            type="tel"
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              padding: '10px 12px',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Location</label>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="City"
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              padding: '10px 12px',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {form.contact_type === 'customer' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Machines</label>
          {form.machines_owned.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {form.machines_owned.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: '#F9FAFB',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 13 }}>{m}</span>
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        machines_owned: f.machines_owned.filter((_, j) => j !== i),
                      }))
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newMachine}
              onChange={(e) => setNewMachine(e.target.value)}
              placeholder="Add machine"
              style={{
                flex: 1,
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                padding: '10px 12px',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => {
                if (newMachine.trim()) {
                  setForm((f) => ({
                    ...f,
                    machines_owned: [...f.machines_owned, newMachine],
                  }));
                  setNewMachine('');
                }
              }}
              style={{
                borderRadius: 10,
                border: '1px solid #3B82F6',
                background: '#3B82F6',
                color: '#fff',
                padding: '10px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </div>
          </div>
        )}

        {form.contact_type === 'supplier' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Materials Supplied</label>
            <input
              value={form.supplier_materials}
              onChange={(e) => setForm((f) => ({ ...f, supplier_materials: e.target.value }))}
              placeholder="e.g., Electrical Components, Hardware"
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                padding: '10px 12px',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            height: 50,
            marginTop: 12,
            borderRadius: 12,
            background: saving ? '#9CA3AF' : '#1B3A6B',
            color: '#fff',
            border: 'none',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {saving ? 'Saving...' : '+ Add Contact'}
        </button>
      </div>
    </BottomSheet>
  );
}

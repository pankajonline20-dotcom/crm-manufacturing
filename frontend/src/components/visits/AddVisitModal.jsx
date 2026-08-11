import { useState } from 'react';
import BottomSheet from '../../components/ui/BottomSheet';
import toast from 'react-hot-toast';

const PURPOSES = ['Demo', 'Meeting', 'Machine Pickup', 'Complaint', 'Payment', 'Just Visiting', 'Other'];

export default function AddVisitModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    visitor_name: '',
    visitor_phone: '',
    visitor_company: '',
    visit_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    visit_time: '',
    visit_purpose: 'Demo',
    machines_interested: '',
    assigned_to: '',
    visit_notes: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.visitor_name || !form.visit_date) {
      toast.error('Visitor Name and Visit Date are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('crm_token')}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        try {
          const visit = await res.json();
          toast.success('✅ Visitor scheduled!');
          setForm({
            visitor_name: '',
            visitor_phone: '',
            visitor_company: '',
            visit_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            visit_time: '',
            visit_purpose: 'Demo',
            machines_interested: '',
            assigned_to: '',
            visit_notes: '',
          });
          onSave?.(visit);
          onClose();
        } catch (e) {
          toast.error('Invalid response from server');
        }
      } else {
        try {
          const error = await res.json();
          toast.error('Error: ' + (error.error || 'Failed to save'));
        } catch (e) {
          toast.error('Server error: ' + res.status + ' ' + res.statusText);
        }
      }
    } catch (err) {
      console.error('Add visit error:', err);
      toast.error('Connection error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Schedule a Visitor">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Visitor Name *</label>
          <input value={form.visitor_name} onChange={(e) => setForm((f) => ({ ...f, visitor_name: e.target.value }))} placeholder="Customer ka naam" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone</label>
          <input value={form.visitor_phone} onChange={(e) => setForm((f) => ({ ...f, visitor_phone: e.target.value }))} placeholder="98765 43210" type="tel" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Company / City</label>
          <input value={form.visitor_company} onChange={(e) => setForm((f) => ({ ...f, visitor_company: e.target.value }))} placeholder="Company ya city" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Visit Date *</label>
          <input value={form.visit_date} onChange={(e) => setForm((f) => ({ ...f, visit_date: e.target.value }))} type="date" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Time</label>
          <input value={form.visit_time} onChange={(e) => setForm((f) => ({ ...f, visit_time: e.target.value }))} placeholder="e.g. 11:00 AM" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
      </div>

      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginTop: 12 }}>Purpose</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
        {PURPOSES.map((p) => (
          <button
            key={p}
            onClick={() => setForm((f) => ({ ...f, visit_purpose: p }))}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              background: form.visit_purpose === p ? '#3B82F6' : '#F3F4F6',
              color: form.visit_purpose === p ? '#fff' : '#374151',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Machines interested in</label>
        <input value={form.machines_interested} onChange={(e) => setForm((f) => ({ ...f, machines_interested: e.target.value }))} placeholder="e.g. T500, CNC Router" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes</label>
        <textarea value={form.visit_notes} onChange={(e) => setForm((f) => ({ ...f, visit_notes: e.target.value }))} placeholder="Any prep needed?" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          height: 50,
          marginTop: 16,
          borderRadius: 12,
          background: saving ? '#9CA3AF' : '#3B82F6',
          color: '#fff',
          border: 'none',
          fontSize: 15,
          fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Scheduling...' : '📅 Schedule Visit'}
      </button>
    </BottomSheet>
  );
}

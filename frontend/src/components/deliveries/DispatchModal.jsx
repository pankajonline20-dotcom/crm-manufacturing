import { useState } from 'react';
import BottomSheet from '../../components/ui/BottomSheet';

export default function DispatchModal({ delivery, open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    transport_company: '',
    vehicle_number: '',
    driver_name: '',
    driver_phone: '',
    tracking_info: '',
    dispatch_notes: '',
    estimated_arrival_date: '',
    send_email: true,
    customer_email: delivery?.customer_email || '',
  });
  const [sending, setSending] = useState(false);
  const [waLink, setWaLink] = useState('');

  async function handleDispatch() {
    if (!delivery) return;
    setSending(true);
    try {
      const res = await fetch(`/api/deliveries/${delivery.id}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('crm_token')}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setWaLink(data.waLink);
        onSuccess?.();
      }
    } catch (err) {
      console.error('Dispatch error:', err);
    }
    setSending(false);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Mark as Dispatched">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Transport Company</label>
          <input value={form.transport_company} onChange={(e) => setForm((f) => ({ ...f, transport_company: e.target.value }))} placeholder="e.g. Mahavir Transport" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Vehicle Number</label>
          <input value={form.vehicle_number} onChange={(e) => setForm((f) => ({ ...f, vehicle_number: e.target.value }))} placeholder="e.g. GJ05AB1234" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Driver Name</label>
          <input value={form.driver_name} onChange={(e) => setForm((f) => ({ ...f, driver_name: e.target.value }))} placeholder="Driver ka naam" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Driver Phone</label>
          <input value={form.driver_phone} onChange={(e) => setForm((f) => ({ ...f, driver_phone: e.target.value }))} placeholder="98765 43210" type="tel" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tracking Number</label>
          <input value={form.tracking_info} onChange={(e) => setForm((f) => ({ ...f, tracking_info: e.target.value }))} placeholder="Optional" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Est. Arrival Date</label>
          <input value={form.estimated_arrival_date} onChange={(e) => setForm((f) => ({ ...f, estimated_arrival_date: e.target.value }))} type="date" style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Note to Customer</label>
        <textarea value={form.dispatch_notes} onChange={(e) => setForm((f) => ({ ...f, dispatch_notes: e.target.value }))} placeholder="Any special instructions..." style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} />
      </div>

      <div
        style={{
          background: '#F9FAFB',
          borderRadius: 12,
          padding: 14,
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Send dispatch email to customer</div>
          <input
            value={form.customer_email}
            onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
            placeholder="Customer email address"
            style={{
              marginTop: 6,
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12, flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={form.send_email}
            onChange={(e) => setForm((f) => ({ ...f, send_email: e.target.checked }))}
          />
          <span style={{ fontSize: 13 }}>Send</span>
        </label>
      </div>

      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: 12,
            background: '#25D366',
            color: '#fff',
            borderRadius: 12,
            padding: '12px',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          📲 Also Send on WhatsApp
        </a>
      )}

      <button
        onClick={handleDispatch}
        disabled={sending}
        style={{
          width: '100%',
          height: 50,
          marginTop: 14,
          borderRadius: 12,
          background: sending ? '#9CA3AF' : '#E8500A',
          color: '#fff',
          border: 'none',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {sending ? 'Dispatching...' : '🚚 Mark as Dispatched & Send Email'}
      </button>
    </BottomSheet>
  );
}

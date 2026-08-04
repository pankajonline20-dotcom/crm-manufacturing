import { useState } from 'react';
import BottomSheet from '../../components/ui/BottomSheet';

export default function VIPToggle({ lead, isAdmin, onUpdate }) {
  const [showNote, setShowNote] = useState(false);
  const [vipNote, setVipNote] = useState(lead?.vip_note || '');
  const [saving, setSaving] = useState(false);

  async function toggleVIP() {
    const newVIPStatus = !lead.is_vip;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/vip`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          is_vip: newVIPStatus,
          vip_note: newVIPStatus ? vipNote : null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate?.(updated);
        setShowNote(false);
        setVipNote('');
      }
    } catch (err) {
      console.error('VIP update error:', err);
    }
    setSaving(false);
  }

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => (lead.is_vip ? toggleVIP() : setShowNote(true))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 10,
          border: 'none',
          cursor: 'pointer',
          background: lead.is_vip ? '#FEF3C7' : '#F9FAFB',
          color: lead.is_vip ? '#92400E' : '#6B7280',
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {lead.is_vip ? '⭐ VIP Customer' : '☆ Mark as VIP'}
      </button>

      <BottomSheet open={showNote} onClose={() => setShowNote(false)} title="Why is this customer VIP?">
        <textarea
          placeholder="e.g. Repeat buyer, sent 3 referrals, big order upcoming..."
          rows={3}
          value={vipNote}
          onChange={(e) => setVipNote(e.target.value)}
          style={{
            width: '100%',
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            padding: 12,
            fontSize: 14,
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            marginBottom: 12,
          }}
        />
        <button
          onClick={toggleVIP}
          disabled={saving}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            background: saving ? '#9CA3AF' : '#F59E0B',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {saving ? 'Saving...' : '⭐ Save VIP Status'}
        </button>
      </BottomSheet>
    </>
  );
}

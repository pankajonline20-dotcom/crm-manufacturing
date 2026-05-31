import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { Loader2 } from 'lucide-react';

const REASONS = ['Price too high', 'Competitor better features', 'Slow delivery', 'No budget now', 'Trust issue', 'Bought locally', 'Other'];

export default function LostDealSheet({ open, onClose, onSave, leadName }) {
  const [competitor, setCompetitor] = useState('');
  const [reason, setReason] = useState('');
  const [theirPrice, setTheirPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ lost_to_competitor: competitor || null, lost_reason: reason || null, lost_their_price: theirPrice || null, lost_notes: notes || null });
    setSaving(false);
    setCompetitor(''); setReason(''); setTheirPrice(''); setNotes('');
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Why did we lose this deal?">
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
        <strong>{leadName}</strong> — Yeh info next time jeetne mein help karegi 🎯
      </p>

      <div style={{ marginBottom: 14 }}>
        <label className="label">Competitor (if any)</label>
        <input value={competitor} onChange={e => setCompetitor(e.target.value)} placeholder="Competitor ka naam (optional)"
          style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', padding: '10px 14px', fontSize: 16, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-primary)' }} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="label">Their price (if known, ₹)</label>
        <input type="number" value={theirPrice} onChange={e => setTheirPrice(e.target.value)} placeholder="e.g. 15000"
          style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', padding: '10px 14px', fontSize: 16, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="label">Main reason</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)}
              style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: reason === r ? '#EF4444' : 'var(--bg-app)',
                color: reason === r ? 'white' : 'var(--text-secondary)',
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="label">Any other details?</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Optional..."
          style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', padding: 12, fontSize: 14, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-primary)' }} />
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ width: '100%', height: 50, borderRadius: 14, background: '#EF4444', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
        Save & Mark as Lost
      </button>
    </BottomSheet>
  );
}

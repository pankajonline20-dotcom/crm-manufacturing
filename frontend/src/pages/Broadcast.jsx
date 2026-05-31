import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import toast from 'react-hot-toast';
import { Send, Radio, Loader2, Eye, ExternalLink, Clock } from 'lucide-react';
import { formatDateTime } from '../utils';

const SEGMENTS = [
  { label: 'All New Leads',       filters: { status: 'new' } },
  { label: 'Interested Leads',    filters: { status: 'interested' } },
  { label: 'Quoted — No Reply',   filters: { status: 'quoted' } },
  { label: '🔥 Hot Leads Only',   filters: { score_label: 'hot' } },
  { label: 'Never Quoted',        filters: { no_quote: true } },
  { label: 'All Active Leads',    filters: {} },
];

const TEMPLATES = [
  { label: 'New machine launch',     text: 'Hi {name}! Hamari nayi machine launch ho gayi hai. Kya aap details dekhna chahenge? Reply karein ya call karein.' },
  { label: 'Festival offer',          text: 'Hi {name}! Is Diwali pe special 5% discount mil raha hai. Aapka order confirm karne ka sahi waqt hai! Call karein.' },
  { label: 'Quote expiry reminder',   text: 'Hi {name}, aapki quote 2 din mein expire ho rahi hai. Abhi confirm karein ya naya quote lein. Hum ready hain!' },
  { label: 'Follow-up nudge',         text: 'Hi {name}! Aap se baat kiye kuch time ho gaya. Kya abhi bhi machine ki zaroorat hai? Hum best deal denge!' },
  { label: 'Referral ask',            text: 'Hi {name}, umeed hai machine acchi chal rahi hai. Agar koi aur chahiye toh humse zaroor milein — referral pe extra benefit bhi!' },
];

export default function Broadcast() {
  const [segment, setSegment] = useState(SEGMENTS[0]);
  const [customFilters, setCustomFilters] = useState('{}');
  const [template, setTemplate] = useState(TEMPLATES[0].text);
  const [broadcastName, setBroadcastName] = useState('');
  const [targetCount, setTargetCount] = useState(null);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => { api.get('/broadcasts').then(r => setHistory(r.data)).catch(() => {}); }, []);

  const fetchCount = async (filters) => {
    try {
      const { data } = await api.post('/broadcasts/preview', { segment_filters: JSON.stringify(filters) });
      setTargetCount(data.count);
    } catch { setTargetCount(null); }
  };

  useEffect(() => { fetchCount(segment.filters); }, [segment]);

  const preview = template.replace(/\{name\}/g, 'Ramesh').replace(/\{city\}/g, 'Surat');

  const handleSend = async () => {
    if (!template.trim()) { toast.error('Write a message first'); return; }
    if (targetCount === 0) { toast.error('No leads match this segment'); return; }
    setSending(true);
    try {
      const { data } = await api.post('/broadcasts', {
        name: broadcastName || `Broadcast ${new Date().toLocaleDateString('en-IN')}`,
        message_template: template,
        segment_filters: JSON.stringify(segment.filters),
      });
      setResult(data);
      toast.success(`Broadcast created for ${data.sent_to} leads!`);
      api.get('/broadcasts').then(r => setHistory(r.data));
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>WhatsApp Broadcast</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Ek message, hazaron customers tak. Personalised links generated automatically.</p>
      </div>

      {result ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'var(--bg-surface)', border: '1px solid #86EFAC', borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📣</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: '0 0 8px' }}>Broadcast Ready!</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            {result.sent_to} personalised WhatsApp links generated. Open each link to send to that customer.
          </p>
          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#14532D', margin: '0 0 8px' }}>Sample links (first 5):</p>
            {(result.sample_links || []).slice(0,3).map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#25D366', marginBottom: 6, textDecoration: 'none', fontWeight: 600 }}>
                <ExternalLink size={12} /> Customer {i + 1} → Open WhatsApp
              </a>
            ))}
          </div>
          <button onClick={() => setResult(null)} className="btn-primary">Send Another Broadcast</button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <label className="label">Broadcast Name</label>
            <input className="input" placeholder={`Broadcast ${new Date().toLocaleDateString('en-IN')}`} value={broadcastName} onChange={e => setBroadcastName(e.target.value)} />
          </div>

          {/* Segment selector */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <label className="label" style={{ marginBottom: 10, display: 'block' }}>Target Segment</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {SEGMENTS.map(s => (
                <button key={s.label} onClick={() => setSegment(s)}
                  style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 150ms',
                    background: segment.label === s.label ? 'var(--brand-primary)' : 'var(--bg-app)',
                    color: segment.label === s.label ? 'white' : 'var(--text-secondary)',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg-app)', borderRadius: 10 }}>
              <Radio size={14} color="var(--brand-primary)" />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                This segment: <strong style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>{targetCount ?? '...'}</strong> leads
              </span>
            </div>
          </div>

          {/* Message template */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <label className="label" style={{ marginBottom: 10, display: 'block' }}>Message Template</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {TEMPLATES.map(t => (
                <button key={t.label} onClick={() => setTemplate(t.text)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  {t.label}
                </button>
              ))}
            </div>
            <textarea value={template} onChange={e => setTemplate(e.target.value)} rows={4}
              style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', padding: 12, fontSize: 14, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-primary)' }}
              placeholder="Write your message... {name} will be replaced with customer's first name." />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>Variables: <code>{'{name}'}</code> <code>{'{city}'}</code></p>
          </div>

          {/* Preview */}
          <div style={{ background: '#DCF8C6', border: '1px solid #86EFAC', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Eye size={14} color="#14532D" />
              <p style={{ fontSize: 12, color: '#14532D', fontWeight: 700, margin: 0 }}>Preview (sample customer: Ramesh, Surat)</p>
            </div>
            <p style={{ fontSize: 14, color: '#111827', lineHeight: 1.6, margin: 0 }}>{preview}</p>
          </div>

          {/* Send */}
          <button onClick={handleSend} disabled={sending || !template.trim() || targetCount === 0}
            style={{ width: '100%', height: 52, borderRadius: 14, background: sending ? 'var(--text-muted)' : 'var(--brand-primary)', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 150ms' }}>
            {sending ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            {sending ? 'Creating...' : `Send to ${targetCount ?? '...'} leads via WhatsApp`}
          </button>
        </div>
      )}

      {/* Broadcast history */}
      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Broadcast History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(b => (
              <div key={b.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Radio size={16} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', align: 'center', gap: 8, marginTop: 2 }}>
                    <Clock size={10} /> {formatDateTime(b.created_at)} · {b.created_by_name}
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)', background: 'var(--brand-primary-light)', padding: '2px 10px', borderRadius: 99 }}>{b.sent_count} leads</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

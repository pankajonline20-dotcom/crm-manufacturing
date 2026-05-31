import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import toast from 'react-hot-toast';
import { Heart, RefreshCw, MessageCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { waLink } from '../utils';

const HEALTH_CONFIG = {
  healthy:  { label: 'Healthy ✓',  bg: '#DCFCE7', color: '#14532D', border: '#86EFAC', action: null },
  at_risk:  { label: 'At Risk ⚠',  bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', action: 'Schedule a check-in call this week' },
  churning: { label: 'Churning 🔴', bg: '#FEE2E2', color: '#7F1D1D', border: '#FCA5A5', action: 'Needs personal attention — CEO call recommended' },
};

function CustomerCard({ customer, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({ complaints: customer.complaints, referrals_given: customer.referrals_given, repurchase_count: customer.repurchase_count, payment_delays: customer.payment_delays });
  const [saving, setSaving] = useState(false);

  const cfg = HEALTH_CONFIG[customer.health_label] || HEALTH_CONFIG.healthy;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/customer-health/${customer.lead_id}`, form);
      toast.success('Updated!');
      onUpdate();
      setExpanded(false);
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: `1px solid ${cfg.border}`, borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
          {customer.name?.[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{customer.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Score: <strong style={{ fontFamily: 'var(--font-mono)', color: cfg.color }}>{customer.health_score}</strong> · {customer.days_since_interaction}d since contact {customer.city ? `· ${customer.city}` : ''}
          </div>
          {cfg.action && <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color, marginTop: 2 }}>→ {cfg.action}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <a href={waLink(customer.phone)} target="_blank" rel="noreferrer"
            style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <MessageCircle size={14} color="#25D366" />
          </a>
          <button onClick={() => setExpanded(!expanded)}
            style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-app)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-app)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              ['Payment Delays', 'payment_delays'],
              ['Complaints', 'complaints'],
              ['Referrals Given', 'referrals_given'],
              ['Repurchases', 'repurchase_count'],
            ].map(([label, field]) => (
              <div key={field}>
                <label className="label">{label}</label>
                <input type="number" min="0" className="input" style={{ fontSize: 13 }} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: parseInt(e.target.value) || 0 }))} />
              </div>
            ))}
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}>
            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            Update & Recalculate
          </button>
        </div>
      )}
    </div>
  );
}

export default function CustomerHealth() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/customer-health');
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRecalc = async () => {
    setRecalculating(true);
    try {
      const { data } = await api.post('/customer-health/recalculate');
      toast.success(data.message);
      await load();
    } catch { toast.error('Failed'); }
    finally { setRecalculating(false); }
  };

  const grouped = { healthy: [], at_risk: [], churning: [] };
  customers.forEach(c => { if (grouped[c.health_label]) grouped[c.health_label].push(c); });

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Customer Health</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Won customers — track retention, referrals, repurchase signals</p>
        </div>
        <button onClick={handleRecalc} disabled={recalculating} className="btn-secondary" style={{ gap: 6 }}>
          <RefreshCw size={14} style={{ animation: recalculating ? 'spin 1s linear infinite' : 'none' }} />
          Recalculate
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {Object.entries(HEALTH_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: cfg.color, marginTop: 4 }}>{grouped[key].length}</div>
          </div>
        ))}
      </div>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12, marginBottom: 8 }} />)
      ) : customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Heart size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>No customers yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Won deals appear here automatically. Click "Recalculate" to populate.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {Object.entries(grouped).map(([key, list]) => {
            const cfg = HEALTH_CONFIG[key];
            return (
              <div key={key}>
                <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: '8px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: cfg.color, fontSize: 13 }}>{cfg.label}</span>
                  <span style={{ fontWeight: 700, color: cfg.color }}>{list.length}</span>
                </div>
                {list.map(c => <CustomerCard key={c.lead_id} customer={c} onUpdate={load} />)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

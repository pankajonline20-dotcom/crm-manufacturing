import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import toast from 'react-hot-toast';
import { Target, Loader2, TrendingUp, Phone, FileText, Trophy } from 'lucide-react';
import { formatINR } from '../utils';

function ProgressBar({ done, target, color }) {
  const pct = target > 0 ? Math.min(Math.round((done / target) * 100), 100) : 0;
  return (
    <div>
      <div style={{ height: 10, background: 'var(--bg-app)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 99, background: pct >= 100 ? '#10B981' : pct >= 70 ? color : '#EF4444' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
        <span>{pct}% done</span>
        <span style={{ fontWeight: 600, color: pct >= 70 ? '#10B981' : '#EF4444' }}>
          {pct >= 100 ? '✓ Goal reached!' : `${100 - pct}% remaining`}
        </span>
      </div>
    </div>
  );
}

export default function Goals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: 'revenue', target_value: '', month: new Date().toISOString().slice(0, 7) });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/goals/current');
    setData(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.target_value) { toast.error('Enter a target value'); return; }
    setSaving(true);
    try {
      await api.post('/goals', form);
      toast.success('Goal saved!');
      await load();
    } catch { toast.error('Failed to save goal'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 24 }}><div className="skeleton" style={{ height: 200, borderRadius: 12 }} /></div>;

  const revenueGoal = data?.goals?.find(g => g.type === 'revenue');
  const dealsGoal   = data?.goals?.find(g => g.type === 'deals');
  const callsGoal   = data?.goals?.find(g => g.type === 'calls');
  const daysLeft    = (data?.daysInMonth || 30) - (data?.daysElapsed || 0);
  const onTrack     = data?.forecast >= (revenueGoal?.target_value || 0);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Monthly Goal Tracker</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{data?.month} · {daysLeft} days remaining</p>
      </div>

      {/* Revenue goal */}
      {revenueGoal && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(232,80,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} color="var(--brand-primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Revenue Goal</h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{formatINR(data?.actual?.revenue)} of {formatINR(revenueGoal.target_value)}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Forecast this month</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: onTrack ? '#10B981' : '#EF4444' }}>
                {formatINR(data?.forecast)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: onTrack ? '#10B981' : '#EF4444' }}>
                {onTrack ? '✓ On track' : '⚠ Behind target'}
              </div>
            </div>
          </div>
          <ProgressBar done={data?.actual?.revenue} target={revenueGoal.target_value} color="var(--brand-primary)" />
        </motion.div>
      )}

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: Trophy,   label: 'Deals Won',    done: data?.actual?.deals,  target: dealsGoal?.target_value, color: '#F59E0B' },
          { icon: Phone,    label: 'Calls Made',   done: data?.actual?.calls,  target: callsGoal?.target_value,  color: '#3B82F6' },
          { icon: FileText, label: 'Quotes Sent',  done: data?.actual?.quotes, target: null,                     color: '#8B5CF6' },
        ].map((s, i) => {
          const Icon = s.icon;
          const pct = s.target ? Math.min(Math.round((s.done / s.target) * 100), 100) : null;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{s.label}</span>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{s.done}</div>
              {s.target && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Target: {s.target} ({pct}%)</div>}
            </motion.div>
          );
        })}
      </div>

      {/* Set new goal */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Set / Update Goal</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label className="label">Month</label>
            <input type="month" className="input" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} />
          </div>
          <div>
            <label className="label">Goal Type</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="revenue">Revenue (₹)</option>
              <option value="deals">Deals Won</option>
              <option value="calls">Calls Made</option>
              <option value="quotes">Quotes Sent</option>
            </select>
          </div>
          <div>
            <label className="label">Target Value</label>
            <input type="number" className="input" placeholder={form.type === 'revenue' ? '500000' : '10'} value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ gap: 6, padding: '10px 16px' }}>
            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Target size={15} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

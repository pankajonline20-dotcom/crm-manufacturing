import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { formatINR } from '../utils';
import { CardSkeleton } from '../components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';

const COLORS = ['#E8500A','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EC4899','#14B8A6'];

const Tip = ({ active, payload, label, money }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: 'var(--shadow-md)' }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.fill || p.color || 'var(--brand-primary)', fontWeight: 600 }}>
          {p.name}: {money ? formatINR(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function BusinessIntelligence() {
  const [bi, setBi] = useState(null);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/bi/summary?period=${period}`).then(r => setBi(r.data)).finally(() => setLoading(false));
  }, [period]);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Business Intelligence</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Paise kahan se aa rahe hain?</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {['7','30','90'].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              style={{ padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 150ms', background: period === d ? 'var(--brand-primary)' : 'transparent', color: period === d ? 'white' : 'var(--text-secondary)' }}>
              Last {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[0,1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Revenue by machine */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Revenue by Machine Model</h3>
              {bi?.revenueByMachine?.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No accepted quotes in this period.</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={bi?.revenueByMachine || []} barCategoryGap="30%">
                    <XAxis dataKey="model" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip money />} />
                    <Bar dataKey="revenue" name="Revenue" fill="var(--brand-primary)" radius={[5,5,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Revenue by city */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Revenue by City</h3>
              {bi?.revenueByCity?.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data for this period.</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={bi?.revenueByCity || []} layout="vertical" barCategoryGap="30%">
                    <XAxis type="number" tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={64} />
                    <Tooltip content={<Tip money />} />
                    <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[0,5,5,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Lead source pie */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Lead Sources (Leads vs Won)</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={bi?.leadsBySource || []} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={65} innerRadius={30} paddingAngle={2}>
                      {(bi?.leadsBySource || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {(bi?.leadsBySource || []).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, textTransform: 'capitalize' }}>{s.source}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.count}</span>
                      <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>({s.won}W)</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Avg deal trend */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Avg Deal Size (Last 6 Months)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={bi?.avgDealByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₹${(v/100000).toFixed(1)}L`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip money />} />
                  <Area type="monotone" dataKey="avg_deal" name="Avg Deal" stroke="#10B981" fill="rgba(16,185,129,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Agent performance */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Agent Performance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {(bi?.agentPerformance || []).map((agent, i) => (
                <div key={i} style={{ background: 'var(--bg-app)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: i===0?'#F59E0B':i===1?'#9CA3AF':'#CD7F32', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {i===0?'🥇':i===1?'🥈':'🥉'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{agent.calls} calls · {agent.leads_called} leads</div>
                  </div>
                </div>
              ))}
              {(bi?.agentPerformance || []).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No call data for this period.</p>}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

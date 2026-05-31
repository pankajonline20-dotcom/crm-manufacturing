import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { Loader2, TrendingUp, Users, CreditCard, Trophy, Award } from 'lucide-react';
import { formatINR } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { CardSkeleton } from '../components/ui/Skeleton';

const PIE_COLORS = ['#3B82F6','#E8500A','#10B981','#EF4444','#8B5CF6','#14B8A6','#F59E0B'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 13 }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ margin: 0, color: p.color || 'var(--brand-primary)', fontWeight: 600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/reports/summary?period=${period}`), api.get('/reports/pipeline')])
      .then(([s, p]) => { setSummary(s.data); setPipeline(p.data); })
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Reports</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Business performance overview</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {['week', 'month'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 150ms', background: period === p ? 'var(--brand-primary)' : 'transparent', color: period === p ? 'white' : 'var(--text-secondary)' }}>
              {p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[0,1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { icon: Users, label: 'Total Leads', value: summary.total_leads, color: '#3B82F6' },
              { icon: TrendingUp, label: 'Conversion Rate', value: `${summary.conversion_rate}%`, color: '#10B981' },
              { icon: CreditCard, label: 'Pipeline Value', value: formatINR(summary.pipeline_value), color: 'var(--brand-primary)' },
              { icon: Trophy, label: 'Deals Won', value: summary.won_leads, color: '#F59E0B' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${kpi.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon size={18} style={{ color: kpi.color }} />
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginBottom: 4 }}>{kpi.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</div>
                </motion.div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Monthly trend */}
            {pipeline?.monthly_leads?.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Monthly Lead Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={pipeline.monthly_leads}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Leads" stroke="var(--brand-primary)" fill="var(--brand-primary-light)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Status breakdown */}
            {summary.status_breakdown?.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Lead Status Distribution</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={summary.status_breakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={2}>
                        {summary.status_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
                    {summary.status_breakdown.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, textTransform: 'capitalize' }}>{s.status}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Source breakdown */}
            {summary.source_breakdown?.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Lead Sources</h3>
                {summary.source_breakdown.map((s, i) => {
                  const max = Math.max(...summary.source_breakdown.map(x => x.count));
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: 500 }}>{s.source}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{s.count}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-app)', borderRadius: 99, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(s.count / max) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                          style={{ height: '100%', background: 'var(--brand-primary)', borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Top agents */}
            {summary.top_agents?.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Top Performers</h3>
                {summary.top_agents.map((agent, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < summary.top_agents.length-1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: i===0?'#F59E0B':i===1?'#9CA3AF':'#CD7F32', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                      {i===0?'🥇':i===1?'🥈':'🥉'}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{agent.leads_won} won</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

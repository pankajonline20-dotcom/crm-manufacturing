import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertCircle, TrendingDown } from 'lucide-react';

export default function CompetitorAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/competitor-analysis').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Competitor & Loss Analysis</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
          Hum deals kyon haar rahe hain? AI analysis. Mark lost deals with reasons to build this data.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-primary)' }} />
        </div>
      ) : data?.total === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <TrendingDown size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>No loss data yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            When you mark a lead as "Lost", add a reason. Data builds up here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Lost Deals', value: data?.totalLost || 0, icon: '❌' },
              { label: 'With Reason Logged', value: data?.total || 0, icon: '📋' },
              { label: 'Top Reason', value: data?.reasonCounts?.[0]?.reason?.split(' ').slice(0,2).join(' ') || '—', icon: '⚠️' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Reasons chart */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Why We Lose</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.reasonCounts || []} layout="vertical" barCategoryGap="30%">
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="reason" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" name="Count" radius={[0,5,5,0]}>
                    {(data?.reasonCounts || []).map((_, i) => <Cell key={i} fill={i===0?'#EF4444':'#F59E0B'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Competitor chart */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Top Competitors</h3>
              {data?.competitorCounts?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No competitor data yet. Add competitor names when marking deals as lost.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data?.competitorCounts || []} layout="vertical" barCategoryGap="30%">
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" name="Deals lost to" fill="#8B5CF6" radius={[0,5,5,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* AI analysis */}
          {data?.analysis && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'linear-gradient(135deg, #1A1D23, #252930)', borderRadius: 14, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={16} color="white" />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: 0 }}>AI Insight</h3>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>Powered by Claude</span>
              </div>
              <div style={{ fontSize: 13, color: '#D1D5DB', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{data.analysis}</div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import MobileHeader from '../../components/layout/MobileHeader';
import { Bell, Phone, MessageCircle, ChevronRight, Flame, Zap, TrendingUp } from 'lucide-react';
import { formatPhone, formatINR, waLink } from '../../utils';
import { useStore } from '../../store';

const STAT_CARDS = [
  { key: 'followups', label: "Today's Calls", icon: '📞', color: '#3B82F6' },
  { key: 'pipeline',  label: 'Pipeline ₹',   icon: '💰', color: '#10B981' },
  { key: 'total',     label: 'Total Leads',   icon: '👤', color: '#8B5CF6' },
  { key: 'conv',      label: 'Conversion',    icon: '🎯', color: 'var(--brand-primary)' },
];

export default function MobileDashboard() {
  const [followups, setFollowups] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activityScore, streak } = useStore();
  const navigate = useNavigate();
  const userName = (() => { try { return JSON.parse(localStorage.getItem('crm_user'))?.name?.split(' ')[0]; } catch { return 'there'; } })();

  useEffect(() => {
    Promise.all([
      api.get('/leads/today-followups'),
      api.get('/leads/pipeline-summary'),
    ]).then(([fu, pl]) => {
      setFollowups(fu.data);
      setPipeline(pl.data);
    }).finally(() => setLoading(false));
  }, []);

  const total = pipeline.reduce((s, p) => s + p.count, 0);
  const won = pipeline.find(p => p.status === 'won')?.count || 0;
  const conv = total > 0 ? `${Math.round((won / total) * 100)}%` : '0%';

  const statValues = {
    followups: followups.length,
    pipeline: total >= 10 ? `${total}` : total,
    total,
    conv,
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', paddingBottom: 80 }}>
      <MobileHeader
        title="Dashboard"
        rightAction={
          <Link to="/leads" style={{ display: 'flex', position: 'relative' }}>
            <Bell size={22} color="var(--text-secondary)" />
            {followups.length > 0 && (
              <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, background: 'var(--brand-primary)', borderRadius: '50%', border: '1.5px solid var(--bg-surface)' }} />
            )}
          </Link>
        }
      />

      {/* Greeting */}
      <div style={{ padding: '16px 16px 8px' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{greeting} 👋</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>{userName}</h2>
      </div>

      {/* Activity score strip */}
      <div style={{ margin: '8px 16px', background: 'linear-gradient(135deg, var(--brand-primary), #B83D07)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px', fontWeight: 600 }}>TODAY'S ACTIVITY SCORE</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)' }}>{activityScore || 42}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>/100</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${activityScore || 42}%` }} transition={{ duration: 1, delay: 0.3 }}
              style={{ height: '100%', background: 'white', borderRadius: 99 }} />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          {streak > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Flame size={22} color="white" />
              <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{streak}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>STREAK</span>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards — horizontal scroll */}
      <div style={{ overflowX: 'auto', padding: '10px 16px', display: 'flex', gap: 10, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {STAT_CARDS.map((s, i) => (
          <motion.div key={s.key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
            style={{ minWidth: 120, background: 'var(--bg-surface)', borderRadius: 14, padding: '14px 14px 12px', boxShadow: 'var(--shadow-sm)', flexShrink: 0, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
              {loading ? '—' : statValues[s.key]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Today's follow-ups */}
      <div style={{ padding: '4px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Today's Follow-ups
            {followups.length > 0 && <span style={{ marginLeft: 8, fontSize: 12, background: 'var(--brand-primary)', color: 'white', borderRadius: 99, padding: '1px 7px', fontWeight: 700 }}>{followups.length}</span>}
          </h3>
          <Link to="/leads" style={{ fontSize: 12, color: 'var(--brand-primary)', fontWeight: 700, textDecoration: 'none' }}>See all</Link>
        </div>

        {followups.length === 0 ? (
          <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '24px 16px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>All done!</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Aaj koi follow-up nahi hai</p>
          </div>
        ) : (
          followups.map((lead, i) => (
            <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '14px', marginBottom: 10, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-primary)' }}>{lead.name[0]}</span>
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => navigate(`/leads/${lead.id}`)}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.requirement || lead.city || 'No requirement noted'}
                  </div>
                  <div style={{ marginTop: 5 }}><StatusBadge status={lead.status} size="sm" /></div>
                </div>
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a href={`tel:+91${lead.phone}`}
                    style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                    <Phone size={17} color="#10B981" />
                  </a>
                  <a href={waLink(lead.phone)} target="_blank" rel="noreferrer"
                    style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                    <MessageCircle size={17} color="#25D366" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pipeline mini summary */}
      {pipeline.length > 0 && (
        <div style={{ margin: '8px 16px 0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>Pipeline</h3>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {pipeline.map((item, i) => {
              const pct = total > 0 ? (item.count / total) * 100 : 0;
              const colors = { new:'#3B82F6', called:'#8B5CF6', interested:'#F59E0B', quoted:'#EC4899', negotiating:'#14B8A6', won:'#10B981', lost:'#EF4444' };
              const color = colors[item.status] || '#6B7280';
              return (
                <Link key={item.status} to={`/leads?status=${item.status}`} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < pipeline.length - 1 ? '1px solid var(--border-subtle)' : 'none', textDecoration: 'none', gap: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{item.status}</span>
                  <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginRight: 8 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', minWidth: 20, textAlign: 'right' }}>{item.count}</span>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

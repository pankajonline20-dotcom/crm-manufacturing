import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';
import StatusBadge from '../components/ui/StatusBadge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useStore } from '../store';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, TrendingUp, CreditCard, Users, ArrowRight, Phone, Flame, Zap, Trophy, ChevronRight } from 'lucide-react';
import { formatINR, formatPhone } from '../utils';

function StatCard({ icon: Icon, label, value, sub, trend, color, sparkData, delay = 0, to }) {
  const [displayed, setDisplayed] = useState(0);
  const numVal = typeof value === 'number' ? value : 0;

  useEffect(() => {
    if (!numVal) return;
    let start = 0;
    const step = numVal / 30;
    const timer = setInterval(() => {
      start += step;
      if (start >= numVal) { setDisplayed(numVal); clearInterval(timer); }
      else setDisplayed(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [numVal]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: '20px 20px 16px' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 12px 0 80px', background: `${color}12` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={18} style={{ color }} />
          </div>
          {trend != null && (
            <span style={{ fontSize: 11, fontWeight: 600, color: trend >= 0 ? 'var(--status-won)' : 'var(--status-lost)', background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 99, padding: '2px 8px' }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
          {typeof value === 'string' ? value : displayed.toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
        {sparkData && (
          <div style={{ height: 36, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <Area type="monotone" dataKey="v" stroke={color} fill={`${color}20`} strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {to && (
          <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--brand-primary)', marginTop: 10, textDecoration: 'none' }}>
            See Details <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function ActivityHeatmap({ data }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots = ['Morning', 'Afternoon', 'Evening'];
  const maxVal = Math.max(...data.flat(), 1);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `48px repeat(7, 1fr)`, gap: 4, alignItems: 'center' }}>
        <div />
        {days.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{d}</div>)}
        {slots.map((slot, si) => (
          <>
            <div key={slot} style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{slot}</div>
            {days.map((_, di) => {
              const val = data[si]?.[di] || 0;
              const intensity = val / maxVal;
              return (
                <div key={di} title={`${slot} ${days[di]}: ${val} calls`}
                  style={{ height: 28, borderRadius: 6, background: intensity === 0 ? 'var(--border-subtle)' : `rgba(232,80,10,${0.15 + intensity * 0.85})`, transition: 'all 200ms', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

function ActivityScore({ score, streak }) {
  const pct = Math.min(100, score);
  const msg = pct >= 80 ? "You're crushing it! 🔥" : pct >= 50 ? "Almost there! 💪" : "Let's get started! 🚀";
  const r = 38, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
          <motion.circle cx="50" cy="50" r={r} fill="none" stroke="var(--brand-primary)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{pct}</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{msg}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Today's activity score</div>
      </div>
      {streak > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--brand-primary-light)', borderRadius: 99, padding: '4px 12px' }}>
          <Flame size={13} style={{ color: 'var(--brand-primary)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)' }}>{streak}-day streak</span>
        </div>
      )}
    </div>
  );
}

const STATUS_ORDER = ['new','called','interested','quoted','negotiating','won','lost'];
const STATUS_COLORS_HEX = { new:'#3B82F6', called:'#8B5CF6', interested:'#F59E0B', quoted:'#EC4899', negotiating:'#14B8A6', won:'#10B981', lost:'#EF4444' };

export default function Dashboard() {
  const [followups, setFollowups] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activityScore, streak } = useStore();

  const heatmapData = [
    [2, 4, 3, 5, 2, 1, 0],
    [3, 6, 4, 7, 5, 2, 1],
    [1, 3, 2, 4, 3, 1, 0],
  ];
  const spark = [{ v: 2 }, { v: 5 }, { v: 3 }, { v: 8 }, { v: 6 }, { v: 9 }, { v: 7 }];

  useEffect(() => {
    Promise.all([
      api.get('/leads/today-followups'),
      api.get('/leads/pipeline-summary'),
      api.get('/payments'),
    ]).then(([fu, pl, pm]) => {
      setFollowups(fu.data);
      setPipeline(pl.data);
      setPayments(pm.data.filter(p => p.status === 'pending').slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const totalLeads = pipeline.reduce((s, p) => s + p.count, 0);
  const wonLeads = pipeline.find(p => p.status === 'won')?.count || 0;
  const convRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const pipelineBarData = STATUS_ORDER.map(s => ({
    status: s.charAt(0).toUpperCase() + s.slice(1),
    count: pipeline.find(p => p.status === s)?.count || 0,
    color: STATUS_COLORS_HEX[s],
  }));

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Good morning, {useStore.getState().activityScore > 80 ? '🔥 ' : ''}{(() => { try { return JSON.parse(localStorage.getItem('crm_user'))?.name?.split(' ')[0] || 'there'; } catch { return 'there'; } })()}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 500 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {loading ? [0,1,2,3].map(i => <CardSkeleton key={i} />) : (
          <>
            <StatCard icon={Calendar} label="Today's Follow-ups" value={followups.length} sub="Due today" color="#E8500A" trend={12} sparkData={spark} delay={0} to="/leads" />
            <StatCard icon={TrendingUp} label="Total Leads" value={totalLeads} sub="In pipeline" color="#3B82F6" trend={8} sparkData={[{v:3},{v:7},{v:5},{v:9},{v:6},{v:12},{v:totalLeads}]} delay={0.08} to="/leads" />
            <StatCard icon={Trophy} label="Conversion Rate" value={`${convRate}%`} sub={`${wonLeads} deals won`} color="#10B981" sparkData={[{v:5},{v:8},{v:6},{v:12},{v:9},{v:15},{v:convRate}]} delay={0.16} to="/reports" />
            <StatCard icon={CreditCard} label="Pending Payments" value={payments.length} sub="Need attention" color="#EC4899" sparkData={[{v:2},{v:4},{v:3},{v:5},{v:payments.length+1},{v:payments.length},{v:payments.length}]} delay={0.24} to="/payments" />
          </>
        )}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
        {/* Pipeline bar chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Pipeline Overview</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Leads by stage</p>
            </div>
            <Link to="/leads" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? <div className="skeleton" style={{ height: 160 }} /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pipelineBarData} barCategoryGap="30%">
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, boxShadow: 'var(--shadow-md)' }}
                  cursor={{ fill: 'var(--bg-app)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Leads">
                  {pipelineBarData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Activity Score */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Activity Score</h3>
            <Zap size={16} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <ActivityScore score={activityScore || 42} streak={streak || 3} />
          <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 600 }}>EARN POINTS</p>
            {[
              { label: 'Log a call', pts: '+5' },
              { label: 'Send a quote', pts: '+15' },
              { label: 'Close a deal', pts: '+20' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>{item.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>{item.pts}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Today's follow-ups */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Today's Follow-ups</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0' }}>{followups.length} due today</p>
            </div>
            <Link to="/leads" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>View all</Link>
          </div>
          {followups.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>All caught up!</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Aaj koi follow-up nahi hai</p>
            </div>
          ) : (
            <div>
              {followups.slice(0, 5).map((lead, i) => (
                <Link key={lead.id} to={`/leads/${lead.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', textDecoration: 'none', transition: 'background 100ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-app)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{lead.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatPhone(lead.phone)} · {lead.city}</div>
                  </div>
                  <StatusBadge status={lead.status} size="sm" />
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Calling Patterns</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>This week's activity heatmap</p>
          </div>
          <ActivityHeatmap data={heatmapData} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Less</span>
            {[0.1, 0.3, 0.55, 0.75, 1].map((op, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: `rgba(232,80,10,${op})` }} />
            ))}
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>More</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import toast from 'react-hot-toast';
import { Play, Zap, Loader2, Check, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const AGENT_CONFIG = {
  CEO: { avatar: '👔', color: '#1B3A6B', bg: '#EEF2FF' },
  COO: { avatar: '⚙️', color: '#0F6E56', bg: '#E1F5EE' },
  CFO: { avatar: '💰', color: '#854F0B', bg: '#FAEEDA' },
  CTO: { avatar: '💻', color: '#534AB7', bg: '#EEEDFE' },
  CMO: { avatar: '📣', color: '#993C1D', bg: '#FAECE7' },
};

const PRIORITY_CONFIG = {
  critical: { bg: '#FEE2E2', color: '#7F1D1D', label: '🔴' },
  high: { bg: '#FEF3C7', color: '#92400E', label: '🟠' },
  medium: { bg: '#EEF2FF', color: '#1E1B4B', label: '🔵' },
  low: { bg: '#F0FDF4', color: '#14532D', label: '🟢' },
};

export default function Boardroom() {
  const [activeTab, setActiveTab] = useState('latest');
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [openActions, setOpenActions] = useState([]);
  const [running, setRunning] = useState(false);
  const [kpiTrend, setKpiTrend] = useState([]);

  useEffect(() => {
    loadMeetings();
    loadActions();
    loadKPIs();
  }, []);

  useEffect(() => {
    if (selectedMeetingId) loadMeetingDetail();
  }, [selectedMeetingId]);

  const loadMeetings = async () => {
    const { data } = await api.get('/api/boardroom/meetings');
    setMeetings(data);
    if (data.length > 0 && !selectedMeetingId) {
      setSelectedMeetingId(data[0].id);
    }
  };

  const loadMeetingDetail = async () => {
    const { data } = await api.get(`/api/boardroom/meetings/${selectedMeetingId}`);
    setSelectedMeeting(data);
  };

  const loadActions = async () => {
    const { data } = await api.get('/api/boardroom/actions');
    setOpenActions(data);
  };

  const loadKPIs = async () => {
    const { data } = await api.get('/api/boardroom/kpi-trend');
    setKpiTrend(data);
  };

  const startMeeting = async (type = 'daily') => {
    setRunning(true);
    try {
      const { data } = await api.post('/api/boardroom/run', { type });
      setSelectedMeetingId(data.meetingId);
      toast.success('Board meeting started!');

      // Poll until complete
      const poll = setInterval(async () => {
        const { data: meeting } = await api.get(`/api/boardroom/meetings/${data.meetingId}`);
        if (meeting.status === 'complete') {
          clearInterval(poll);
          setRunning(false);
          loadMeetings();
          loadMeetingDetail();
          loadActions();
          loadKPIs();
        }
      }, 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Meeting failed');
      setRunning(false);
    }
  };

  const updateActionStatus = async (actionId, status) => {
    await api.put(`/api/boardroom/actions/${actionId}`, { status });
    toast.success('Action updated');
    loadActions();
  };

  return (
    <div style={{ background: '#F4F5F7', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#1B3A6B', padding: '20px 24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🏛️ AI Executive Boardroom</h1>
            <p style={{ fontSize: 12, color: '#93C5FD', margin: '4px 0 0' }}>
              {meetings.length > 0 ? `Last: ${new Date(meetings[0]?.started_at).toLocaleString('en-IN')}` : 'No meetings yet'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['daily', 'weekly', 'monthly'].map(type => (
              <button key={type} onClick={() => startMeeting(type)} disabled={running}
                style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: running ? '#374151' : '#E8500A', color: 'white', fontSize: 13, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {running ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Agent avatars */}
        <div style={{ display: 'flex', gap: 16, marginTop: 20, justifyContent: 'center' }}>
          {Object.entries(AGENT_CONFIG).map(([name, cfg]) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: cfg.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {cfg.avatar}
              </div>
              <div style={{ color: '#93C5FD', fontSize: 11, fontWeight: 700, marginTop: 4 }}>{name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #E5E7EB', maxWidth: 1200, margin: '0 auto' }}>
        {['latest', 'actions', 'history', 'kpis'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? '#E8500A' : '#6B7280', borderBottom: activeTab === tab ? '2px solid #E8500A' : '2px solid transparent' }}>
            {tab === 'latest' ? 'Latest Meeting' : tab === 'actions' ? `Actions (${openActions.length})` : tab === 'history' ? 'History' : 'KPI Trends'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {activeTab === 'latest' && selectedMeeting && <MeetingTranscript meeting={selectedMeeting} running={running} />}
        {activeTab === 'actions' && <ActionsBoard actions={openActions} onStatusChange={updateActionStatus} />}
        {activeTab === 'history' && <MeetingHistory meetings={meetings} onSelect={id => setSelectedMeetingId(id)} />}
        {activeTab === 'kpis' && <KPITrends data={kpiTrend} />}
      </div>
    </div>
  );
}

function MeetingTranscript({ meeting, running }) {
  const bottomRef = useRef(null);
  const transcript = meeting?.full_transcript || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length]);

  if (!meeting && !running) {
    return <div style={{ textAlign: 'center', padding: '60px 20px' }}>🏛️ No meetings yet. Click a button above to start.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
      <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E5E7EB' }}>
        {meeting?.executive_summary && (
          <div style={{ background: '#1B3A6B', borderRadius: 14, padding: 16, marginBottom: 20, color: 'white' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#93C5FD', marginBottom: 6 }}>EXECUTIVE SUMMARY</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{meeting.executive_summary}</div>
          </div>
        )}
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#111827' }}>Board Discussion</h3>
        {transcript.map((msg, i) => {
          const cfg = AGENT_CONFIG[msg.role];
          return (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: cfg?.color || '#6B7280', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {cfg?.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: cfg?.color, marginBottom: 4 }}>{msg.role}</div>
                <div style={{ background: cfg?.bg || '#F9FAFB', borderRadius: '4px 14px 14px 14px', padding: '12px 14px', fontSize: 13, lineHeight: 1.6, color: '#111827' }}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        {running && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: '#E5E7EB', flexShrink: 0 }} />
            <div style={{ flex: 1, paddingTop: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: '#E8500A', animation: 'bounce 0.6s infinite', animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Right sidebar */}
      <div>
        {meeting?.data_snapshot && (
          <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #E5E7EB', marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#6B7280' }}>DATA SNAPSHOT</h4>
            {[
              { label: 'Revenue', value: `₹${(meeting.data_snapshot.revenue?.thisMonth/100000||0).toFixed(1)}L` },
              { label: 'Conversion', value: `${meeting.data_snapshot.deals?.conversionRate||0}%` },
              { label: 'Hot leads', value: meeting.data_snapshot.leads?.hot || 0 },
              { label: 'Overdue', value: meeting.data_snapshot.leads?.overdueFollowups || 0 },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F9FAFB', fontSize: 12 }}>
                <span style={{ color: '#6B7280' }}>{item.label}</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#111827' }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {meeting?.actions?.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #E5E7EB' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#111827' }}>Action Items</h4>
            {meeting.actions.map(action => {
              const p = PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.medium;
              const daysLeft = Math.ceil((new Date(action.due_date) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={action.id} style={{ borderBottom: '1px solid #F9FAFB', paddingBottom: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', flex: 1 }}>{action.title}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 12, background: p.bg, color: p.color, fontWeight: 700 }}>{p.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4 }}>{action.owner} · {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionsBoard({ actions, onStatusChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {['critical', 'high', 'medium'].map(priority => {
        const p = PRIORITY_CONFIG[priority];
        const filtered = actions.filter(a => a.priority === priority);
        return (
          <div key={priority} style={{ background: 'white', borderRadius: 14, padding: 16, border: `1px solid ${p.bg}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{p.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.label === '🔴' ? 'Critical' : p.label === '🟠' ? 'High' : 'Medium'} ({filtered.length})</span>
            </div>
            {filtered.map(action => {
              const daysLeft = Math.ceil((new Date(action.due_date) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <motion.div key={action.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: p.bg, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{action.title}</div>
                  <div style={{ fontSize: 11, color: p.color, marginBottom: 8, fontWeight: 600 }}>→ {action.owner} · {daysLeft}d</div>
                  {action.status === 'open' && (
                    <button onClick={() => onStatusChange(action.id, 'in_progress')}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: 6, background: p.color, color: 'white', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Start
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function MeetingHistory({ meetings, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {meetings.map(meeting => (
        <motion.button key={meeting.id} onClick={() => onSelect(meeting.id)} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 150ms', textAlign: 'left' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#E8500A'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
          <Clock size={16} color={meeting.status === 'complete' ? '#10B981' : '#F59E0B'} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', textTransform: 'capitalize' }}>{meeting.meeting_type} Meeting</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{new Date(meeting.started_at).toLocaleString('en-IN')}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: meeting.status === 'complete' ? '#DCFCE7' : '#FEF3C7', color: meeting.status === 'complete' ? '#14532D' : '#92400E' }}>
            {meeting.status === 'complete' ? '✓ Complete' : '⏳ Running'}
          </div>
        </motion.button>
      ))}
    </div>
  );
}

function KPITrends({ data }) {
  if (!data || data.length === 0) return <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>No KPI data yet</div>;

  const latest = data[data.length - 1] || {};
  const previous = data[data.length - 2];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {[
        { label: 'Revenue', value: `₹${(latest.revenue_this_month||0)/100000}L`, prev: previous?.revenue_this_month },
        { label: 'Leads', value: latest.total_leads || 0, prev: previous?.total_leads },
        { label: 'Win Rate', value: `${latest.conversion_rate||0}%`, prev: previous?.conversion_rate },
        { label: 'Pending $', value: `₹${(latest.pending_payments||0)/100000}L`, prev: previous?.pending_payments },
      ].map(item => (
        <div key={item.label} style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 6 }}>{item.label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#111827' }}>{item.value}</div>
          {item.prev !== undefined && (
            <div style={{ fontSize: 11, color: item.value > item.prev ? '#10B981' : '#EF4444', marginTop: 4, fontWeight: 600 }}>
              {item.value > item.prev ? '↑' : '↓'} vs previous
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import api from '../../api';
import StatusBadge, { STATUSES } from '../../components/ui/StatusBadge';
import MobileHeader from '../../components/layout/MobileHeader';
import BottomSheet from '../../components/ui/BottomSheet';
import { useStore } from '../../store';
import toast from 'react-hot-toast';
import { Search, Plus, Phone, MessageCircle, Edit2, Filter, X } from 'lucide-react';
import { formatPhone, waLink, SOURCE_LABELS } from '../../utils';

const FILTER_STATUSES = ['All', ...STATUSES];

function SwipeableLeadCard({ lead, onStatusChange, navigate }) {
  const [swiped, setSwiped] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => setSwiped(true),
    onSwipedRight: () => setSwiped(false),
    trackMouse: false,
    delta: 40,
    preventScrollOnSwipe: true,
  });

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = lead.next_followup_date && lead.next_followup_date < today;
  const isToday = lead.next_followup_date === today;

  return (
    <div style={{ position: 'relative', marginBottom: 8, borderRadius: 14, overflow: 'hidden' }}>
      {/* Revealed action buttons (behind card) */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
        background: 'var(--bg-app)',
      }}>
        <a href={`tel:+91${lead.phone}`}
          style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <Phone size={20} color="#10B981" />
        </a>
        <a href={waLink(lead.phone)} target="_blank" rel="noreferrer"
          style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <MessageCircle size={20} color="#25D366" />
        </a>
        <button onClick={() => navigate(`/leads/${lead.id}`)}
          style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <Edit2 size={18} color="#8B5CF6" />
        </button>
      </div>

      {/* The card itself */}
      <div {...handlers} onClick={() => { if (!swiped) navigate(`/leads/${lead.id}`); else setSwiped(false); }}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 14,
          padding: '14px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          transform: swiped ? 'translateX(-178px)' : 'translateX(0)',
          transition: 'transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          position: 'relative',
          cursor: 'pointer',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}>
        {isOverdue && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: '#EF4444', borderRadius: '14px 14px 0 0' }} />
        )}
        {isToday && !isOverdue && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: 'var(--brand-primary)', borderRadius: '14px 14px 0 0' }} />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {lead.city ? `📍 ${lead.city}  ·  ` : ''}📞 {formatPhone(lead.phone)}
            </div>
          </div>
          <StatusBadge status={lead.status} size="sm" />
        </div>

        {lead.requirement && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {lead.requirement}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {lead.source ? SOURCE_LABELS[lead.source] || lead.source : '—'}
          </span>
          {lead.next_followup_date && (
            <span style={{ fontSize: 11, fontWeight: 600, color: isOverdue ? '#EF4444' : isToday ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
              {isOverdue ? '⚠️ Overdue' : isToday ? '📅 Today' : `📅 ${lead.next_followup_date}`}
            </span>
          )}
        </div>

        {/* Swipe hint */}
        {!swiped && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--text-muted)', opacity: 0.5 }}>‹</div>
        )}
      </div>
    </div>
  );
}

export default function MobileLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('');
  const navigate = useNavigate();
  const { addScore } = useStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeFilter !== 'All') params.set('status', activeFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      const { data } = await api.get(`/leads?${params}`);
      setLeads(data);
    } finally { setLoading(false); }
  }, [search, activeFilter, sourceFilter]);

  useEffect(() => { load(); }, [activeFilter, sourceFilter]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') load();
  };

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', paddingBottom: 80 }}>
      <MobileHeader
        title="Leads"
        subtitle={loading ? '' : `${leads.length} leads`}
        rightAction={
          <button onClick={() => navigate('/leads/new')}
            style={{ border: 'none', background: 'var(--brand-primary)', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Add
          </button>
        }
      />

      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch}
            placeholder="Search by name or phone..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 16, color: 'var(--text-primary)', background: 'transparent', fontFamily: 'var(--font-primary)' }}
          />
          {search && <button onClick={() => { setSearch(''); load(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={14} color="var(--text-muted)" /></button>}
        </div>
      </div>

      {/* Status filter chips — horizontal scroll */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {FILTER_STATUSES.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', flexShrink: 0, cursor: 'pointer',
              background: activeFilter === f ? 'var(--brand-primary)' : 'var(--bg-surface)',
              color: activeFilter === f ? '#fff' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, boxShadow: 'var(--shadow-sm)',
              WebkitTapHighlightColor: 'transparent',
            }}>
            {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={() => setShowFilterSheet(true)}
          style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Filter size={12} /> More
        </button>
      </div>

      {/* Lead cards */}
      <div style={{ padding: '0 16px' }}>
        {leads.length > 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
            ← Swipe left on a card for quick actions
          </p>
        )}

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 90, borderRadius: 14, marginBottom: 8 }} className="skeleton" />
          ))
        ) : leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Koi lead nahi mila</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 16px' }}>Try a different filter</p>
            <button onClick={() => navigate('/leads/new')} className="btn-primary" style={{ margin: '0 auto' }}>
              + Add New Lead
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {leads.map((lead, i) => (
              <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <SwipeableLeadCard lead={lead} navigate={navigate} onStatusChange={() => {}} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* FAB */}
      <motion.button whileTap={{ scale: 0.93 }} onClick={() => navigate('/leads/new')}
        style={{
          position: 'fixed', bottom: 76, right: 20,
          width: 56, height: 56, borderRadius: 28,
          background: 'var(--brand-primary)', border: 'none', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(232,80,10,0.45)',
          zIndex: 800, cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}>
        <Plus size={26} color="#fff" />
      </motion.button>

      {/* More filters bottom sheet */}
      <BottomSheet open={showFilterSheet} onClose={() => setShowFilterSheet(false)} title="Filter Leads">
        <div style={{ marginBottom: 16 }}>
          <label className="label">Source</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['', ...Object.keys(SOURCE_LABELS)].map(s => (
              <button key={s} onClick={() => setSourceFilter(s)}
                style={{ padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: sourceFilter === s ? 'var(--brand-primary)' : 'var(--bg-app)',
                  color: sourceFilter === s ? 'white' : 'var(--text-secondary)',
                }}>
                {s === '' ? 'All Sources' : SOURCE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowFilterSheet(false)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}>
          Apply Filters
        </button>
      </BottomSheet>
    </div>
  );
}

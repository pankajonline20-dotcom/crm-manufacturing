import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import api from '../api';
import StatusBadge, { STATUSES } from '../components/ui/StatusBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { Search, Plus, Filter, Phone, MapPin, LayoutGrid, List, Columns, X, MessageCircle, FileText, ChevronRight, Star } from 'lucide-react';
import { formatDate, formatPhone, SOURCE_LABELS, waLink } from '../utils';

const STATUS_META = {
  new:         { label: 'New',         color: '#3B82F6', bg: 'rgba(59,130,246,0.06)' },
  called:      { label: 'Called',      color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)' },
  interested:  { label: 'Interested',  color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
  quoted:      { label: 'Quoted',      color: '#EC4899', bg: 'rgba(236,72,153,0.06)' },
  negotiating: { label: 'Negotiating', color: '#14B8A6', bg: 'rgba(20,184,166,0.06)' },
  won:         { label: 'Won',         color: '#10B981', bg: 'rgba(16,185,129,0.06)' },
  lost:        { label: 'Lost',        color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table'); // 'table' | 'kanban'
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: searchParams.get('status') || '', source: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeChips, setActiveChips] = useState([]);
  const { addScore } = useStore();

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filters.status) params.set('status', filters.status);
      if (filters.source) params.set('source', filters.source);
      const { data } = await api.get(`/leads?${params}`);
      setLeads(data);
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => { loadLeads(); }, [filters]);

  useEffect(() => {
    const chips = [];
    if (filters.status) chips.push({ key: 'status', label: `Status: ${filters.status}` });
    if (filters.source) chips.push({ key: 'source', label: `Source: ${filters.source}` });
    if (search) chips.push({ key: 'search', label: `"${search}"` });
    setActiveChips(chips);
  }, [filters, search]);

  const removeChip = (key) => {
    if (key === 'search') setSearch('');
    else setFilters(f => ({ ...f, [key]: '' }));
  };

  const updateStatus = async (leadId, newStatus) => {
    const oldLead = leads.find(l => l.id === leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try {
      await api.put(`/leads/${leadId}`, { status: newStatus });
      if (newStatus === 'won') {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#E8500A', '#F59E0B', '#10B981'] });
        toast.success('🎉 Deal Won! Congratulations!', { duration: 4000 });
        addScore(20);
      } else {
        toast.success('Status updated');
      }
    } catch {
      setLeads(prev => prev.map(l => l.id === leadId ? oldLead : l));
      toast.error('Update failed');
    }
  };

  const toggleVIP = async (leadId, currentVIP) => {
    const oldLead = leads.find(l => l.id === leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, is_vip: currentVIP ? 0 : 1 } : l));
    try {
      await api.put(`/leads/${leadId}/vip`, { is_vip: currentVIP ? 0 : 1 });
      toast.success(currentVIP ? 'Removed from VIP' : '⭐ Added to VIP!');
    } catch {
      setLeads(prev => prev.map(l => l.id === leadId ? oldLead : l));
      toast.error('VIP update failed');
    }
  };

  const onDragEnd = (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId;
    const leadId = parseInt(draggableId);
    const lead = leads.find(l => l.id === leadId);
    if (lead?.status === newStatus) return;
    updateStatus(leadId, newStatus);
  };

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s);
    return acc;
  }, {});

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Leads</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 500 }}>{leads.length} leads found</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {[['table', List, 'Table'], ['kanban', Columns, 'Kanban']].map(([v, Icon, label]) => (
                <button key={v} onClick={() => setView(v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 150ms', background: view === v ? 'var(--brand-primary)' : 'transparent', color: view === v ? 'white' : 'var(--text-secondary)' }}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
            <Link to="/leads/new" className="btn-primary" style={{ fontSize: 13, padding: '7px 14px' }}>
              <Plus size={15} /> Add Lead
            </Link>
          </div>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by name or phone..."
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadLeads()} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary" style={{ padding: '7px 14px', gap: 6, fontSize: 13 }}>
            <Filter size={14} /> Filters {activeChips.length > 0 && `(${activeChips.length})`}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Status</label>
                  <select className="input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                    <option value="">All Statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Source</label>
                  <select className="input" value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
                    <option value="">All Sources</option>
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={() => { setFilters({ status: '', source: '' }); setSearch(''); }} className="btn-ghost" style={{ fontSize: 12 }}>Clear all</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active chips */}
        {activeChips.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {activeChips.map(chip => (
              <span key={chip.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                {chip.label}
                <button onClick={() => removeChip(chip.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
        {loading ? (
          <TableSkeleton rows={6} />
        ) : leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Koi lead nahi mila</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 16px' }}>Try different filters or add a new lead</p>
            <Link to="/leads/new" className="btn-primary">+ Add First Lead</Link>
          </div>
        ) : view === 'table' ? (
          <TableView leads={leads} onStatusChange={updateStatus} onVIPToggle={toggleVIP} />
        ) : (
          <KanbanView grouped={grouped} onDragEnd={onDragEnd} />
        )}
      </div>
    </div>
  );
}

function TableView({ leads, onStatusChange, onVIPToggle }) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 0, padding: '10px 16px', borderBottom: '2px solid var(--border)', background: 'var(--bg-app)' }}>
        {['Contact', 'Phone', 'Requirement', 'Status', 'Follow-up', 'Actions'].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
        ))}
      </div>

      {leads.map((lead, i) => {
        const isOverdue = lead.next_followup_date && lead.next_followup_date < today;
        const isToday = lead.next_followup_date === today;

        return (
          <motion.div key={lead.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 0, padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', cursor: 'pointer', transition: 'background 100ms' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-app)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

            <Link to={`/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{lead.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{lead.name}</div>
                  {lead.city && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.city}</div>}
                </div>
              </div>
            </Link>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{formatPhone(lead.phone)}</div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
              {lead.requirement || '—'}
            </div>

            <div>
              <select value={lead.status} onChange={e => onStatusChange(lead.id, e.target.value)} onClick={e => e.stopPropagation()}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'transparent', width: 0, height: 0, position: 'absolute' }} />
              <div onClick={e => { e.preventDefault(); const sel = e.currentTarget.nextSibling; sel && sel.focus(); }}>
                <StatusBadge status={lead.status} size="sm" />
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? 'var(--status-lost)' : isToday ? 'var(--status-interested)' : 'var(--text-muted)' }}>
              {isOverdue ? '⚠ Overdue' : isToday ? '📅 Today' : formatDate(lead.next_followup_date) || '—'}
            </div>

            <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onVIPToggle?.(lead.id, lead.is_vip)}
                className="btn-ghost"
                style={{ padding: '5px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title={lead.is_vip ? 'Remove VIP' : 'Mark as VIP'}
              >
                <Star size={14} fill={lead.is_vip ? '#FFB800' : 'none'} color={lead.is_vip ? '#FFB800' : '#D1D5DB'} />
              </button>
              <a href={waLink(lead.phone)} target="_blank" rel="noreferrer" className="btn-ghost" style={{ padding: '5px', borderRadius: 6 }}>
                <MessageCircle size={14} style={{ color: '#25D366' }} />
              </a>
              <Link to={`/quotations/new?lead_id=${lead.id}&lead_name=${encodeURIComponent(lead.name)}`} className="btn-ghost" style={{ padding: '5px', borderRadius: 6 }}>
                <FileText size={14} />
              </Link>
              <Link to={`/leads/${lead.id}`} className="btn-ghost" style={{ padding: '5px', borderRadius: 6 }}>
                <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function KanbanView({ grouped, onDragEnd }) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, minHeight: 400 }}>
        {STATUSES.map(status => {
          const meta = STATUS_META[status];
          const cards = grouped[status] || [];
          return (
            <div key={status} className="kanban-col" style={{ background: meta.bg, borderRadius: 12, border: `1px solid ${meta.color}22`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${meta.color}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'block' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: `${meta.color}20`, color: meta.color, borderRadius: 99, padding: '1px 8px' }}>{cards.length}</span>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    style={{ flex: 1, padding: '8px', minHeight: 80, background: snapshot.isDraggingOver ? `${meta.color}08` : 'transparent', transition: 'background 200ms' }}>
                    {cards.map((lead, idx) => (
                      <Draggable key={lead.id} draggableId={String(lead.id)} index={idx}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            style={{ ...provided.draggableProps.style, marginBottom: 6, userSelect: 'none',
                              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px',
                              boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                              transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} rotate(2deg) scale(1.02)` : provided.draggableProps.style?.transform,
                              opacity: snapshot.isDragging ? 0.95 : 1, transition: snapshot.isDragging ? undefined : 'box-shadow 150ms, opacity 150ms' }}>
                            <Link to={`/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
                              {lead.city && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{lead.city}</div>}
                              {lead.requirement && <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>{lead.requirement}</div>}
                            </Link>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{formatPhone(lead.phone)}</span>
                              <a href={waLink(lead.phone)} target="_blank" rel="noreferrer" style={{ color: '#25D366', display: 'flex' }} onClick={e => e.stopPropagation()}>
                                <MessageCircle size={13} />
                              </a>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {cards.length === 0 && !snapshot.isDraggingOver && (
                      <div style={{ textAlign: 'center', padding: '16px 8px', fontSize: 11, color: 'var(--text-muted)' }}>Drop here</div>
                    )}
                  </div>
                )}
              </Droppable>

              <Link to={`/leads/new`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 11, fontWeight: 600, color: meta.color, textDecoration: 'none', borderTop: `1px solid ${meta.color}22`, transition: 'background 100ms' }}
                onMouseEnter={e => e.currentTarget.style.background = `${meta.color}10`}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Plus size={12} /> Add lead
              </Link>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

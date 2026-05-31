import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import api from '../api';
import StatusBadge, { STATUSES } from '../components/ui/StatusBadge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import {
  Phone, MapPin, Mail, ArrowLeft, MessageCircle, Edit2, Save, X, Trash2,
  Plus, FileText, Clock, Loader2, Copy, Check, CreditCard, Truck, Image
} from 'lucide-react';
import { formatDate, formatDateTime, formatINR, formatPhone, waLink, SOURCE_LABELS, LEAD_STATUSES } from '../utils';

const STATUS_META = {
  new:'#3B82F6', called:'#8B5CF6', interested:'#F59E0B', quoted:'#EC4899',
  negotiating:'#14B8A6', won:'#10B981', lost:'#EF4444'
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { addScore } = useStore();
  const isNew = id === 'new';

  const [lead, setLead] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [editing, setEditing] = useState(isNew);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('calls');
  const [showDelete, setShowDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addingCall, setAddingCall] = useState(false);
  const [callForm, setCallForm] = useState({ notes: '', duration_minutes: '' });

  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: '', source: 'manual',
    requirement: '', status: 'new', assigned_to: '', next_followup_date: ''
  });

  useEffect(() => {
    if (!isNew) { loadLead(); loadCallLogs(); loadQuotes(); }
  }, [id]);

  const loadLead = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/leads/${id}`);
      setLead(data);
      setForm({ name: data.name||'', phone: data.phone||'', email: data.email||'', city: data.city||'', source: data.source||'manual', requirement: data.requirement||'', status: data.status||'new', assigned_to: data.assigned_to||'', next_followup_date: data.next_followup_date||'' });
    } catch { toast.error('Lead not found'); navigate('/leads'); }
    finally { setLoading(false); }
  };

  const loadCallLogs = async () => { const { data } = await api.get(`/leads/${id}/call-logs`); setCallLogs(data); };
  const loadQuotes = async () => { const { data } = await api.get(`/quotations?lead_id=${id}`); setQuotes(data); };

  const handleSave = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    setSaving(true);
    try {
      if (isNew) {
        const { data } = await api.post('/leads', form);
        toast.success('Lead added!');
        navigate(`/leads/${data.id}`);
      } else {
        await api.put(`/leads/${id}`, form);
        await loadLead();
        setEditing(false);
        toast.success('Lead updated!');
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/leads/${id}`, { status: newStatus });
      setLead(l => ({ ...l, status: newStatus }));
      setForm(f => ({ ...f, status: newStatus }));
      if (newStatus === 'won') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#E8500A','#F59E0B','#10B981'] });
        toast.success('🎉 Deal Won! Amazing work!', { duration: 5000 });
        addScore(20);
      } else { toast.success('Status updated'); }
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/leads/${id}`); toast.success('Lead deleted'); navigate('/leads'); }
    catch { toast.error('Delete failed'); }
  };

  const handleAddCallLog = async () => {
    if (!callForm.notes) { toast.error('Notes required'); return; }
    try {
      await api.post(`/leads/${id}/call-log`, callForm);
      setCallForm({ notes: '', duration_minutes: '' });
      setAddingCall(false);
      await loadCallLogs();
      addScore(5);
      toast.success('Call logged! +5 points 🎯');
    } catch { toast.error('Failed to add log'); }
  };

  const copyPhone = () => {
    navigator.clipboard.writeText(lead.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return (
    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
      <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
      <CardSkeleton />
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      {/* Back button */}
      <button onClick={() => navigate('/leads')} className="btn-ghost" style={{ marginBottom: 16, padding: '6px 10px' }}>
        <ArrowLeft size={16} /> Back to Leads
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Contact card */}
          <div className="card-flat" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header strip */}
            <div style={{ height: 6, background: `linear-gradient(90deg, var(--brand-primary), ${STATUS_META[lead?.status || 'new']})` }} />
            <div style={{ padding: 20 }}>
              {isNew ? (
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>New Lead</h3>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>{lead?.name[0]}</div>
                      <div>
                        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{lead?.name}</h2>
                        {lead?.city && <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin size={11} />{lead.city}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditing(!editing)} className="btn-ghost" style={{ padding: '5px 8px', fontSize: 12 }}>
                        <Edit2 size={13} />
                      </button>
                      {isAdmin && <button onClick={() => setShowDelete(true)} className="btn-ghost" style={{ padding: '5px 8px', color: 'var(--status-lost)' }}><Trash2 size={13} /></button>}
                    </div>
                  </div>

                  <StatusBadge status={lead?.status} />

                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <a href={`tel:+91${lead.phone}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>+91 {formatPhone(lead.phone)}</a>
                      <button onClick={copyPhone} className="btn-ghost" style={{ padding: '2px 6px', fontSize: 11 }}>
                        {copied ? <Check size={12} style={{ color: 'var(--status-won)' }} /> : <Copy size={12} />}
                      </button>
                    </div>
                    {lead.email && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={13} style={{ color: 'var(--text-muted)' }} /><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{lead.email}</span></div>}
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-app)', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
                      {SOURCE_LABELS[lead.source] || lead.source}
                    </span>
                    {lead.next_followup_date && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-interested)', background: 'rgba(245,158,11,0.12)', borderRadius: 6, padding: '2px 8px' }}>
                        📅 {formatDate(lead.next_followup_date)}
                      </span>
                    )}
                  </div>

                  {lead.requirement && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-app)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {lead.requirement}
                    </div>
                  )}
                </>
              )}

              {/* Edit form */}
              <AnimatePresence>
                {editing && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: isNew ? 0 : 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: isNew ? 0 : 12, borderTop: isNew ? 'none' : '1px solid var(--border)' }}>
                      {[['Name *', 'name', 'text'], ['Phone *', 'phone', 'tel'], ['Email', 'email', 'email'], ['City', 'city', 'text']].map(([label, field, type]) => (
                        <div key={field}>
                          <label className="label">{label}</label>
                          <input type={type} className="input" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                        </div>
                      ))}
                      <div>
                        <label className="label">Status</label>
                        <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Next Follow-up</label>
                        <input type="date" className="input" value={form.next_followup_date} onChange={e => setForm(f => ({ ...f, next_followup_date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Requirement</label>
                        <textarea className="input" rows={3} value={form.requirement} onChange={e => setForm(f => ({ ...f, requirement: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          {isNew ? 'Create Lead' : 'Save'}
                        </button>
                        {!isNew && <button onClick={() => setEditing(false)} className="btn-secondary" style={{ padding: '8px 12px' }}><X size={14} /></button>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action buttons */}
          {!isNew && !editing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href={waLink(lead.phone)} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: 'white', borderRadius: 10, padding: '10px 16px', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                <MessageCircle size={16} /> Open WhatsApp
              </a>
              <Link to={`/quotations/new?lead_id=${lead.id}&lead_name=${encodeURIComponent(lead.name)}`} className="btn-primary" style={{ justifyContent: 'center', padding: '10px 16px' }}>
                <FileText size={16} /> Create Quotation
              </Link>
            </div>
          )}

          {/* Status quick-change */}
          {!isNew && !editing && (
            <div className="card-flat" style={{ padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Move to Stage</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LEAD_STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'all 150ms',
                      background: lead.status === s ? STATUS_META[s] : 'var(--bg-app)',
                      color: lead.status === s ? 'white' : 'var(--text-secondary)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        {!isNew && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: '12px 12px 0 0', border: '1px solid var(--border)', borderBottom: 'none', overflow: 'hidden' }}>
              {[
                { id: 'calls', label: `Calls (${callLogs.length})`, icon: Phone },
                { id: 'quotes', label: `Quotes (${quotes.length})`, icon: FileText },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 150ms',
                      background: activeTab === tab.id ? 'var(--brand-primary)' : 'transparent',
                      color: activeTab === tab.id ? 'white' : 'var(--text-secondary)' }}>
                    <Icon size={14} /> {tab.label}
                  </button>
                );
              })}
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '0 0 12px 12px', padding: 20, minHeight: 300 }}>
              {activeTab === 'calls' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Call History</h4>
                    <button onClick={() => setAddingCall(!addingCall)} className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                      <Plus size={13} /> Log Call
                    </button>
                  </div>

                  <AnimatePresence>
                    {addingCall && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        style={{ background: 'var(--bg-app)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
                        <div style={{ marginBottom: 10 }}>
                          <label className="label">Call Notes *</label>
                          <textarea className="input" rows={3} placeholder="What was discussed? Next steps?"
                            value={callForm.notes} onChange={e => setCallForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <label className="label">Duration (minutes)</label>
                          <input type="number" className="input" placeholder="5" value={callForm.duration_minutes}
                            onChange={e => setCallForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={handleAddCallLog} className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}>Save Log</button>
                          <button onClick={() => setAddingCall(false)} className="btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }}>Cancel</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {callLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <Phone size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No calls logged yet</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Log your first call to track progress</p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
                      {callLogs.map((log, i) => (
                        <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          style={{ display: 'flex', gap: 14, paddingBottom: 16, position: 'relative' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                            <Phone size={13} color="white" />
                          </div>
                          <div style={{ flex: 1, background: 'var(--bg-app)', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{log.agent_name}</span>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={10} /> {formatDateTime(log.called_at)}
                                {log.duration_minutes && ` · ${log.duration_minutes}m`}
                              </div>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{log.notes}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'quotes' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Quotations</h4>
                    <Link to={`/quotations/new?lead_id=${lead.id}&lead_name=${encodeURIComponent(lead.name)}`} className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                      <Plus size={13} /> New Quote
                    </Link>
                  </div>
                  {quotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <FileText size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No quotes yet</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {quotes.map(q => (
                        <div key={q.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-app)', borderRadius: 10, gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{q.quote_number}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(q.created_at)} · Valid {q.validity_days}d</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatINR(q.total_amount)}</div>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: q.status==='accepted'?'rgba(16,185,129,0.12)':q.status==='rejected'?'rgba(239,68,68,0.12)':'rgba(59,130,246,0.12)', color: q.status==='accepted'?'var(--status-won)':q.status==='rejected'?'var(--status-lost)':'var(--status-new)' }}>{q.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setShowDelete(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 24, maxWidth: 360, width: '100%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Delete Lead?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px' }}>This will permanently delete {lead?.name} and all associated data.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowDelete(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button onClick={handleDelete} className="btn-danger" style={{ flex: 1, justifyContent: 'center' }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

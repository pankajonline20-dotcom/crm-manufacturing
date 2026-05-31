import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import api from '../../api';
import StatusBadge, { STATUSES } from '../../components/ui/StatusBadge';
import MobileHeader from '../../components/layout/MobileHeader';
import BottomSheet from '../../components/ui/BottomSheet';
import { useStore } from '../../store';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Phone, MessageCircle, FileText, Plus, Clock, Loader2, Copy, Check, Edit2, Trash2, Save, X, ChevronDown } from 'lucide-react';
import { formatDate, formatDateTime, formatINR, formatPhone, waLink, SOURCE_LABELS, LEAD_STATUSES } from '../../utils';

export default function MobileLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { addScore } = useStore();
  const isNew = id === 'new';

  const [lead, setLead] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('calls');
  const [showCallSheet, setShowCallSheet] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(isNew);
  const [copied, setCopied] = useState(false);
  const [callForm, setCallForm] = useState({ notes: '', duration_minutes: '' });
  const [form, setForm] = useState({ name:'', phone:'', email:'', city:'', source:'manual', requirement:'', status:'new', next_followup_date:'' });

  useEffect(() => {
    if (!isNew) { loadLead(); loadCallLogs(); loadQuotes(); }
  }, [id]);

  const loadLead = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/leads/${id}`);
      setLead(data);
      setForm({ name:data.name||'', phone:data.phone||'', email:data.email||'', city:data.city||'', source:data.source||'manual', requirement:data.requirement||'', status:data.status||'new', next_followup_date:data.next_followup_date||'' });
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
        toast.success('Lead created!');
        navigate(`/leads/${data.id}`, { replace: true });
      } else {
        await api.put(`/leads/${id}`, form);
        await loadLead();
        setShowEditSheet(false);
        toast.success('Saved!');
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (newStatus) => {
    setShowStatusSheet(false);
    try {
      await api.put(`/leads/${id}`, { status: newStatus });
      setLead(l => ({ ...l, status: newStatus }));
      if (newStatus === 'won') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        toast.success('🎉 Deal Won!', { duration: 4000 });
        addScore(20);
      } else toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  const handleLogCall = async () => {
    if (!callForm.notes) { toast.error('Notes required'); return; }
    try {
      await api.post(`/leads/${id}/call-log`, callForm);
      setCallForm({ notes: '', duration_minutes: '' });
      setShowCallSheet(false);
      await loadCallLogs();
      addScore(5);
      toast.success('+5 points! Call logged 🎯');
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/leads/${id}`); toast.success('Deleted'); navigate('/leads', { replace: true }); }
    catch { toast.error('Failed'); }
  };

  const copyPhone = () => {
    navigator.clipboard.writeText(lead.phone);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <MobileHeader title="Lead Detail" showBack />
      <div style={{ padding: 16 }}>
        {[120, 80, 60].map((h, i) => <div key={i} style={{ height: h, borderRadius: 14, marginBottom: 12 }} className="skeleton" />)}
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', paddingBottom: 100 }}>
      <MobileHeader
        title={isNew ? 'New Lead' : (lead?.name || 'Lead')}
        showBack
        rightAction={!isNew && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setShowEditSheet(true)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-app)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Edit2 size={15} color="var(--text-secondary)" />
            </button>
            {isAdmin && (
              <button onClick={() => setShowDeleteSheet(true)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-app)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Trash2 size={15} color="#EF4444" />
              </button>
            )}
          </div>
        )}
      />

      {/* Contact card */}
      {!isNew && lead && (
        <div style={{ margin: '12px 16px 0', background: 'var(--bg-surface)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ height: 4, background: 'var(--brand-primary)' }} />
          <div style={{ padding: '16px' }}>
            {/* Avatar + name */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{lead.name[0]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{lead.name}</div>
                {lead.city && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>📍 {lead.city}</div>}
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => setShowStatusSheet(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <StatusBadge status={lead.status} size="sm" />
                    <ChevronDown size={12} color="var(--text-muted)" />
                  </button>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <Phone size={14} color="var(--text-muted)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>+91 {formatPhone(lead.phone)}</span>
              <button onClick={copyPhone} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                {copied ? <Check size={15} color="#10B981" /> : <Copy size={15} color="var(--text-muted)" />}
              </button>
            </div>

            {/* Requirement */}
            {lead.requirement && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg-app)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {lead.requirement}
              </div>
            )}

            {/* Next followup */}
            {lead.next_followup_date && (
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: 'var(--brand-primary)' }}>
                📅 Next follow-up: {formatDate(lead.next_followup_date)}
              </div>
            )}

            {/* Action row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
              <a href={`tel:+91${lead.phone}`} style={{ height: 46, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', gap: 3 }}>
                <Phone size={17} color="#10B981" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981' }}>Call</span>
              </a>
              <a href={waLink(lead.phone)} target="_blank" rel="noreferrer" style={{ height: 46, borderRadius: 12, background: 'rgba(37,211,102,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', gap: 3 }}>
                <MessageCircle size={17} color="#25D366" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#25D366' }}>WhatsApp</span>
              </a>
              <Link to={`/quotations/new?lead_id=${lead.id}&lead_name=${encodeURIComponent(lead.name)}`} style={{ height: 46, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', gap: 3 }}>
                <FileText size={17} color="#8B5CF6" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#8B5CF6' }}>Quote</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!isNew && (
        <>
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: 'calls', label: `Calls (${callLogs.length})` },
              { id: 'quotes', label: `Quotes (${quotes.length})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0, fontSize: 13, fontWeight: 600, WebkitTapHighlightColor: 'transparent',
                  background: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 16px' }}>
            {activeTab === 'calls' && (
              <div>
                {callLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <Phone size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>No calls logged yet</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Tap the button below to log your first call</p>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 15, top: 4, bottom: 4, width: 2, background: 'var(--border)' }} />
                    {callLogs.map((log, i) => (
                      <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        style={{ display: 'flex', gap: 12, paddingBottom: 14, position: 'relative' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                          <Phone size={13} color="white" />
                        </div>
                        <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 12, padding: '10px 14px', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{log.agent_name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {formatDateTime(log.called_at)}{log.duration_minutes ? ` · ${log.duration_minutes}m` : ''}
                            </span>
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
                {quotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <FileText size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>No quotes yet</p>
                  </div>
                ) : quotes.map(q => (
                  <div key={q.id} style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '14px', marginBottom: 8, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{q.quote_number}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(q.created_at)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatINR(q.total_amount)}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: q.status==='accepted'?'rgba(16,185,129,0.12)':'rgba(59,130,246,0.12)', color: q.status==='accepted'?'#10B981':'#3B82F6' }}>{q.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Log Call FAB */}
      {!isNew && (
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowCallSheet(true)}
          style={{
            position: 'fixed', bottom: 76, right: 20,
            background: 'var(--brand-primary)', color: '#fff', border: 'none',
            borderRadius: 28, padding: '14px 20px',
            fontSize: 14, fontWeight: 700,
            boxShadow: '0 4px 20px rgba(232,80,10,0.45)',
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            zIndex: 800, WebkitTapHighlightColor: 'transparent',
          }}>
          <Phone size={18} /> Log Call
        </motion.button>
      )}

      {/* Log Call bottom sheet */}
      <BottomSheet open={showCallSheet} onClose={() => setShowCallSheet(false)} title="Log a Call">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label">Call Notes *</label>
            <textarea rows={4} value={callForm.notes} onChange={e => setCallForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="What was discussed? Any next steps?"
              style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', padding: '12px', fontSize: 16, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'var(--font-primary)', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" value={callForm.duration_minutes} onChange={e => setCallForm(f => ({ ...f, duration_minutes: e.target.value }))}
              placeholder="5" style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', padding: '12px', fontSize: 16, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }} />
          </div>
          <button onClick={handleLogCall} style={{ width: '100%', height: 52, borderRadius: 14, background: 'var(--brand-primary)', color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
            Save Call Log (+5 pts 🎯)
          </button>
        </div>
      </BottomSheet>

      {/* Status picker */}
      <BottomSheet open={showStatusSheet} onClose={() => setShowStatusSheet(false)} title="Change Status">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LEAD_STATUSES.map(s => {
            const colors = { new:'#3B82F6', called:'#8B5CF6', interested:'#F59E0B', quoted:'#EC4899', negotiating:'#14B8A6', won:'#10B981', lost:'#EF4444' };
            const c = colors[s] || '#6B7280';
            return (
              <button key={s} onClick={() => handleStatusChange(s)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: `2px solid ${lead?.status === s ? c : 'transparent'}`, background: lead?.status === s ? `${c}15` : 'var(--bg-app)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: lead?.status === s ? 700 : 500, color: lead?.status === s ? c : 'var(--text-primary)', textTransform: 'capitalize', flex: 1, textAlign: 'left' }}>{s}</span>
                {lead?.status === s && <Check size={16} color={c} />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Edit sheet */}
      <BottomSheet open={showEditSheet} onClose={() => !isNew && setShowEditSheet(false)} title={isNew ? 'New Lead' : 'Edit Lead'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[['Name *','name','text'],['Phone *','phone','tel'],['Email','email','email'],['City','city','text']].map(([label, field, type]) => (
            <div key={field}>
              <label className="label">{label}</label>
              <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', padding: '12px', fontSize: 16, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-primary)' }} />
            </div>
          ))}
          <div>
            <label className="label">Next Follow-up</label>
            <input type="date" value={form.next_followup_date} onChange={e => setForm(f => ({ ...f, next_followup_date: e.target.value }))}
              style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', padding: '12px', fontSize: 16, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label className="label">Requirement</label>
            <textarea rows={3} value={form.requirement} onChange={e => setForm(f => ({ ...f, requirement: e.target.value }))}
              style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', padding: '12px', fontSize: 16, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-primary)' }} />
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', height: 52, borderRadius: 14, background: 'var(--brand-primary)', color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {isNew ? 'Create Lead' : 'Save Changes'}
          </button>
        </div>
      </BottomSheet>

      {/* Delete confirm */}
      <BottomSheet open={showDeleteSheet} onClose={() => setShowDeleteSheet(false)} title="Delete Lead?">
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
          This will permanently delete <strong>{lead?.name}</strong> and all associated data. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowDeleteSheet(false)}
            style={{ flex: 1, height: 48, borderRadius: 12, background: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: 15, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
            Cancel
          </button>
          <button onClick={handleDelete}
            style={{ flex: 1, height: 48, borderRadius: 12, background: '#EF4444', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: 'white' }}>
            Delete
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

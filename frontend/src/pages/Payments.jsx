import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import toast from 'react-hot-toast';
import { CreditCard, MessageCircle, Check, Loader2, X, ArrowUpRight, Trash2 } from 'lucide-react';
import { formatINR, formatDate } from '../utils';
import { TableSkeleton } from '../components/ui/Skeleton';

const MODES = ['bank_transfer', 'upi', 'cash', 'cheque'];

const STATUS_STYLE = {
  pending:  { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444' },
  partial:  { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
  received: { bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayment, setNewPayment] = useState({ amount: '', mode: 'bank_transfer', status: 'pending' });

  useEffect(() => { loadPayments(); }, []);

  const loadPayments = async () => {
    setLoading(true);
    const { data } = await api.get('/payments');
    setPayments(data);
    setLoading(false);
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/payments/${id}`, editForm);
      await loadPayments();
      setEditingId(null);
      toast.success('Payment updated!');
    } catch { toast.error('Update failed'); }
  };

  const sendReminder = async (id) => {
    try {
      const { data } = await api.post(`/payments/${id}/send-reminder`);
      window.open(data.wa_link, '_blank');
      await loadPayments();
      toast.success('Reminder sent via WhatsApp!');
    } catch { toast.error('Failed'); }
  };

  const deletePayment = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await api.delete(`/payments/${id}`);
      await loadPayments();
      toast.success('Payment deleted!');
    } catch (err) {
      console.error('Delete error:', err);
      const msg = err.response?.data?.error || err.response?.data?.details || err.message || 'Delete failed';
      toast.error(msg);
    }
  };

  const pending = payments.filter(p => p.status !== 'received');
  const received = payments.filter(p => p.status === 'received');
  const totalPending = pending.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Payment Tracker</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{pending.length} pending · {formatINR(totalPending)} due</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: 'var(--brand-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Add Payment
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Pending', value: formatINR(totalPending), color: '#EF4444', icon: '⏳' },
          { label: 'Partial Payments', value: payments.filter(p=>p.status==='partial').length, color: '#F59E0B', icon: '½' },
          { label: 'Received', value: received.length, color: '#10B981', icon: '✓' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Add Payment Form */}
      {showAddForm && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Add New Payment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Lead ID *</label>
              <input type="text" placeholder="Lead ID" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} value={newPayment.lead_id || ''} onChange={e => setNewPayment(prev => ({ ...prev, lead_id: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Amount (₹) *</label>
              <input type="number" placeholder="0" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} value={newPayment.amount || ''} onChange={e => setNewPayment(prev => ({ ...prev, amount: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mode</label>
              <select style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} value={newPayment.mode || ''} onChange={e => setNewPayment(prev => ({ ...prev, mode: e.target.value }))}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Status</label>
              <select style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} value={newPayment.status || 'pending'} onChange={e => setNewPayment(prev => ({ ...prev, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="received">Received</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowAddForm(false); setNewPayment({ amount: '', mode: 'bank_transfer', status: 'pending' }); }} style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <TableSkeleton rows={5} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {payments.map((p, i) => {
            const st = STATUS_STYLE[p.status] || STATUS_STYLE.pending;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>{p.lead_name?.[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{p.lead_name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color }}>
                        {p.status}
                      </span>
                      {p.reminder_count > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.reminder_count} reminder{p.reminder_count > 1 ? 's' : ''} sent</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.quote_number} · +91 {p.lead_phone}</div>
                    {p.payment_date && <div style={{ fontSize: 12, color: 'var(--status-won)', marginTop: 2 }}>Paid on {formatDate(p.payment_date)}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatINR(p.amount)}</div>
                  </div>
                </div>

                {editingId === p.id ? (
                  <div style={{ padding: '12px 18px', background: 'var(--bg-app)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                      {[
                        { label: 'Amount (₹)', field: 'amount', type: 'number' },
                        { label: 'Payment Date', field: 'payment_date', type: 'date' },
                      ].map(f => (
                        <div key={f.field}>
                          <label className="label">{f.label}</label>
                          <input type={f.type} className="input" style={{ fontSize: 13 }} value={editForm[f.field] || ''} onChange={e => setEditForm(prev => ({ ...prev, [f.field]: e.target.value }))} />
                        </div>
                      ))}
                      <div>
                        <label className="label">Mode</label>
                        <select className="input" style={{ fontSize: 13 }} value={editForm.mode || ''} onChange={e => setEditForm(prev => ({ ...prev, mode: e.target.value }))}>
                          <option value="">Select</option>
                          {MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Status</label>
                        <select className="input" style={{ fontSize: 13 }} value={editForm.status || 'pending'} onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}>
                          <option value="pending">Pending</option>
                          <option value="partial">Partial</option>
                          <option value="received">Received</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => saveEdit(p.id)} className="btn-primary" style={{ fontSize: 13, padding: '7px 14px' }}><Check size={14} /> Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary" style={{ fontSize: 13, padding: '7px 12px' }}><X size={14} /></button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditingId(p.id); setEditForm({ amount: p.amount, payment_date: p.payment_date||'', mode: p.mode||'', status: p.status, notes: p.notes||'' }); }}
                      className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                      <CreditCard size={13} /> Mark Payment
                    </button>
                    {p.status !== 'received' && (
                      <button onClick={() => sendReminder(p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#25D366', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'opacity 150ms' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        <MessageCircle size={13} /> Send Reminder
                      </button>
                    )}
                    <button onClick={() => deletePayment(p.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'opacity 150ms' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Truck, CheckCircle, MessageCircle, Plus, Loader2, AlertCircle } from 'lucide-react';
import { formatDate, formatINR } from '../utils';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [machines, setMachines] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ lead_id: '', machine_id: '', delivered_at: '', notes: '' });

  useEffect(() => {
    Promise.all([
      api.get('/deliveries'),
      api.get('/machines?active_only=true'),
      api.get('/leads?status=won'),
    ]).then(([d, m, l]) => {
      setDeliveries(d.data);
      setMachines(m.data);
      setLeads(l.data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    if (!form.lead_id || !form.machine_id) { toast.error('Select lead and machine'); return; }
    try {
      await api.post('/deliveries', form);
      const d = await api.get('/deliveries');
      setDeliveries(d.data);
      setShowAdd(false);
      setForm({ lead_id: '', machine_id: '', delivered_at: '', notes: '' });
      toast.success('Delivery added!');
    } catch { toast.error('Failed'); }
  };

  const toggleInstallation = async (delivery) => {
    await api.put(`/deliveries/${delivery.id}`, { installation_done: !delivery.installation_done });
    const d = await api.get('/deliveries');
    setDeliveries(d.data);
    toast.success('Updated!');
  };

  const sendFollowup = async (delivery, type) => {
    const { data } = await api.post(`/deliveries/${delivery.id}/send-followup`);
    window.open(data.wa_link, '_blank');
    const field = type === 7 ? { followup_7day_sent: true } : { followup_30day_sent: true };
    await api.put(`/deliveries/${delivery.id}`, field);
    const d = await api.get('/deliveries');
    setDeliveries(d.data);
    toast.success('Follow-up link opened!');
  };

  const getDayFlag = (d) => {
    const days = d.days_since_delivery;
    if (days >= 7 && !d.followup_7day_sent) return '7-day';
    if (days >= 30 && !d.followup_30day_sent) return '30-day';
    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">After-Sales Tracker</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> Add Delivery
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-900">Add Delivery Record</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Customer (Won Lead)</label>
              <select className="input" value={form.lead_id} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}>
                <option value="">Select lead...</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Machine</label>
              <select className="input" value={form.machine_id} onChange={e => setForm(f => ({ ...f, machine_id: e.target.value }))}>
                <option value="">Select machine...</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.model_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Delivery Date</label>
              <input type="date" className="input" value={form.delivered_at} onChange={e => setForm(f => ({ ...f, delivered_at: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary text-sm">Save Delivery</button>
            <button onClick={() => setShowAdd(false)} className="btn-outline text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-primary-700" /></div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-16 card">
          <Truck size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No deliveries recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map(d => {
            const flag = getDayFlag(d);
            return (
              <div key={d.id} className={`card ${flag ? 'border-l-4 border-orange-400' : ''}`}>
                {flag && (
                  <div className="flex items-center gap-1.5 text-orange-600 text-xs font-medium mb-2">
                    <AlertCircle size={14} /> {flag} follow-up pending!
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{d.lead_name}</p>
                    <p className="text-sm text-gray-600">{d.model_name}</p>
                    <p className="text-xs text-gray-500">
                      Delivered: {formatDate(d.delivered_at)}
                      {d.days_since_delivery !== null && ` (${d.days_since_delivery} days ago)`}
                    </p>
                    {d.notes && <p className="text-xs text-gray-500 mt-1">{d.notes}</p>}
                  </div>
                  <div>
                    <button
                      onClick={() => toggleInstallation(d)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                        d.installation_done
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      <CheckCircle size={13} />
                      {d.installation_done ? 'Installed' : 'Mark Installed'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {!d.followup_7day_sent && d.days_since_delivery >= 7 && (
                    <button onClick={() => sendFollowup(d, 7)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2 rounded-lg">
                      <MessageCircle size={13} /> 7-Day Follow-up
                    </button>
                  )}
                  {!d.followup_30day_sent && d.days_since_delivery >= 30 && (
                    <button onClick={() => sendFollowup(d, 30)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 rounded-lg">
                      <MessageCircle size={13} /> 30-Day Follow-up
                    </button>
                  )}
                  {d.followup_7day_sent && d.followup_30day_sent && (
                    <p className="text-xs text-green-600 font-medium w-full text-center py-1">All follow-ups sent ✓</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

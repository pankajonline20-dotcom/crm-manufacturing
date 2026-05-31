import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Plus, Trash2, FileText, MessageCircle, Loader2, ArrowLeft } from 'lucide-react';
import { formatINR } from '../utils';

export default function QuotationBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillLeadId = searchParams.get('lead_id');
  const prefillLeadName = searchParams.get('lead_name');

  const [machines, setMachines] = useState([]);
  const [leads, setLeads] = useState([]);
  const [leadId, setLeadId] = useState(prefillLeadId || '');
  const [leadSearch, setLeadSearch] = useState(prefillLeadName || '');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ payment_terms: '50% advance, 50% on delivery', validity_days: 15, notes: '' });
  const [saving, setSaving] = useState(false);
  const [savedQuote, setSavedQuote] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    api.get('/machines?active_only=true').then(r => setMachines(r.data));
    api.get('/leads').then(r => setLeads(r.data));
  }, []);

  const addItem = (machineId) => {
    const m = machines.find(m => m.id === parseInt(machineId));
    if (!m) return;
    if (items.find(i => i.machine_id === m.id)) {
      toast('Already added. Change quantity below.');
      return;
    }
    setItems(prev => [...prev, {
      machine_id: m.id, model_name: m.model_name, qty: 1,
      unit_price: m.price || 0, gst: m.gst_percent || 18
    }]);
  };

  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: parseFloat(val) || 0 } : item));
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const calcTotals = () => {
    let subtotal = 0, gstAmount = 0;
    for (const item of items) {
      const line = item.unit_price * item.qty;
      subtotal += line;
      gstAmount += line * (item.gst / 100);
    }
    return { subtotal, gstAmount, total: subtotal + gstAmount };
  };

  const { subtotal, gstAmount, total } = calcTotals();

  const handleSave = async () => {
    if (!leadId) { toast.error('Select a lead first'); return; }
    if (items.length === 0) { toast.error('Add at least one machine'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/quotations', { lead_id: leadId, items, ...form });
      setSavedQuote(data);
      toast.success(`Quotation ${data.quote_number} created!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!savedQuote) return;
    setGeneratingPdf(true);
    try {
      const { data } = await api.post(`/quotations/${savedQuote.id}/generate-pdf`);
      toast.success('PDF generated!');
      window.open(`http://localhost:3001${data.pdf_url}`, '_blank');
    } catch { toast.error('PDF generation failed'); }
    finally { setGeneratingPdf(false); }
  };

  const getWaLink = () => {
    if (!savedQuote) return '#';
    const lead = leads.find(l => l.id === parseInt(leadId));
    if (!lead) return '#';
    const msg = `Hi ${lead.name}, aapki quotation ${savedQuote.quote_number} ready hai. Total: ${formatINR(total)}. Validity: ${form.validity_days} days. Please confirm karein!`;
    return `https://wa.me/91${lead.phone}?text=${encodeURIComponent(msg)}`;
  };

  const filteredLeads = leadSearch ? leads.filter(l => l.name.toLowerCase().includes(leadSearch.toLowerCase()) || l.phone.includes(leadSearch)) : leads.slice(0, 10);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Create Quotation</h2>
      </div>

      {/* Lead Selection */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Select Customer</h3>
        {prefillLeadName ? (
          <p className="text-sm font-medium text-primary-700 bg-primary-50 rounded-lg px-3 py-2">{prefillLeadName}</p>
        ) : (
          <>
            <input className="input mb-2" placeholder="Search lead by name or phone..."
              value={leadSearch} onChange={e => setLeadSearch(e.target.value)} />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredLeads.map(l => (
                <button key={l.id} onClick={() => { setLeadId(l.id); setLeadSearch(l.name); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${leadId == l.id ? 'bg-primary-700 text-white' : 'hover:bg-gray-100'}`}>
                  {l.name} — {l.phone} {l.city ? `(${l.city})` : ''}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Machines */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Add Machines</h3>
        <select className="input mb-3" onChange={e => { addItem(e.target.value); e.target.value = ''; }} defaultValue="">
          <option value="" disabled>Select machine to add...</option>
          {machines.map(m => (
            <option key={m.id} value={m.id}>{m.model_name} — {formatINR(m.price)}</option>
          ))}
        </select>

        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No machines added yet</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const lineTotal = item.unit_price * item.qty;
              const lineTotalWithGst = lineTotal + lineTotal * (item.gst / 100);
              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-sm text-gray-900">{item.model_name}</p>
                    <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <label className="label text-xs">Qty</label>
                      <input type="number" min="1" className="input text-sm py-1.5" value={item.qty}
                        onChange={e => updateItem(idx, 'qty', e.target.value)} />
                    </div>
                    <div>
                      <label className="label text-xs">Unit Price (₹)</label>
                      <input type="number" className="input text-sm py-1.5" value={item.unit_price}
                        onChange={e => updateItem(idx, 'unit_price', e.target.value)} />
                    </div>
                    <div>
                      <label className="label text-xs">GST %</label>
                      <input type="number" className="input text-sm py-1.5" value={item.gst}
                        onChange={e => updateItem(idx, 'gst', e.target.value)} />
                    </div>
                  </div>
                  <p className="text-xs text-right text-gray-600 mt-1">
                    {formatINR(lineTotal)} + GST = <strong>{formatINR(lineTotalWithGst)}</strong>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="card bg-primary-50">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>GST Amount</span>
              <span>{formatINR(gstAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-primary-700 pt-2 border-t border-primary-200">
              <span>Total Amount</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Terms */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Terms & Notes</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Payment Terms</label>
            <input className="input" value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} />
          </div>
          <div>
            <label className="label">Validity (days)</label>
            <input type="number" className="input" value={form.validity_days} onChange={e => setForm(f => ({ ...f, validity_days: parseInt(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {!savedQuote ? (
          <button onClick={handleSave} disabled={saving || items.length === 0} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {saving ? 'Creating...' : 'Create Quotation'}
          </button>
        ) : (
          <div className="card bg-green-50 border-green-200">
            <p className="font-semibold text-green-800 text-center">✓ Quotation {savedQuote.quote_number} Created!</p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleGeneratePdf} disabled={generatingPdf} className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm">
                {generatingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Download PDF
              </button>
              <a href={getWaLink()} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                <MessageCircle size={16} /> Send on WhatsApp
              </a>
            </div>
            <button onClick={() => navigate(`/leads/${leadId}`)} className="w-full btn-outline text-sm mt-2">
              Back to Lead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

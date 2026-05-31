import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Edit2, Package, Upload, Loader2, ChevronDown, ChevronUp, Image, Video, X } from 'lucide-react';
import { formatINR } from '../utils';

export default function Machines() {
  const { isAdmin } = useAuth();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMachine, setEditMachine] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [uploading, setUploading] = useState(null);

  const emptyForm = { model_name: '', category: '', price: '', gst_percent: 18, description: '', is_active: true };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadMachines(); }, []);

  const loadMachines = async () => {
    setLoading(true);
    const { data } = await api.get('/machines');
    setMachines(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMachine) {
        await api.put(`/machines/${editMachine.id}`, form);
        toast.success('Machine updated!');
      } else {
        await api.post('/machines', form);
        toast.success('Machine added!');
      }
      setShowForm(false);
      setEditMachine(null);
      setForm(emptyForm);
      await loadMachines();
    } catch { toast.error('Save failed'); }
  };

  const handleEdit = (m) => {
    setEditMachine(m);
    setForm({
      model_name: m.model_name, category: m.category || '', price: m.price || '',
      gst_percent: m.gst_percent || 18, description: m.description || '', is_active: !!m.is_active
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (m) => {
    await api.put(`/machines/${m.id}`, { is_active: !m.is_active });
    await loadMachines();
    toast.success(m.is_active ? 'Machine deactivated' : 'Machine activated');
  };

  const handleUpload = async (machineId, files) => {
    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    setUploading(machineId);
    try {
      await api.post(`/machines/${machineId}/media`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await loadMachines();
      toast.success('Files uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(null); }
  };

  const categories = ['T-Shirt Heat Press', 'Mug Press', 'Cap Press', 'Combo Press', 'Plate Press', 'Other'];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Machine Catalog</h2>
        {isAdmin && (
          <button onClick={() => { setShowForm(!showForm); setEditMachine(null); setForm(emptyForm); }}
            className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} /> Add Machine
          </button>
        )}
      </div>

      {/* Form */}
      {isAdmin && showForm && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">{editMachine ? 'Edit Machine' : 'Add New Machine'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Model Name *</label>
              <input className="input" value={form.model_name} onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input type="number" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="label">GST %</label>
              <input type="number" className="input" value={form.gst_percent} onChange={e => setForm(f => ({ ...f, gst_percent: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            {editMachine && (
              <div className="sm:col-span-2 flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active (visible to agents)</label>
              </div>
            )}
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary text-sm">Save</button>
              <button type="button" onClick={() => { setShowForm(false); setEditMachine(null); }} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Machine List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-primary-700" /></div>
      ) : machines.length === 0 ? (
        <div className="text-center py-16 card">
          <Package size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No machines yet. Add your first machine!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {machines.map(m => (
            <div key={m.id} className={`card ${!m.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{m.model_name}</h3>
                    {m.category && <span className="badge bg-blue-50 text-blue-700">{m.category}</span>}
                    {!m.is_active && <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
                  </div>
                  <div className="flex gap-3 mt-1 text-sm text-gray-600">
                    <span className="font-medium text-primary-700">{formatINR(m.price)}</span>
                    <span className="text-gray-400">+{m.gst_percent}% GST</span>
                    <span className="text-gray-500">= {formatINR(m.price * (1 + m.gst_percent / 100))}</span>
                  </div>
                  {m.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.description}</p>}
                </div>
                <div className="flex gap-2 ml-3">
                  {isAdmin && (
                    <>
                      <button onClick={() => handleEdit(m)} className="p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                        {expanded === m.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </>
                  )}
                  {!isAdmin && (
                    <button onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                      {expanded === m.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded: Specs, Media */}
              {expanded === m.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {/* Specs */}
                  {m.specifications && (() => {
                    try {
                      const specs = JSON.parse(m.specifications);
                      return (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Specifications</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(specs).map(([k, v]) => (
                              <div key={k} className="text-xs">
                                <span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}: </span>
                                <span className="font-medium text-gray-800">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } catch { return null; }
                  })()}

                  {/* Upload */}
                  {isAdmin && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Media</h4>
                      <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-primary-500 transition-colors">
                        {uploading === m.id ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} className="text-gray-400" />}
                        <span className="text-sm text-gray-500">Upload photos / videos</span>
                        <input type="file" multiple accept="image/*,video/*" className="hidden"
                          onChange={e => handleUpload(m.id, Array.from(e.target.files))} />
                      </label>
                    </div>
                  )}

                  {/* Media grid */}
                  {m.media && m.media.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {(() => {
                        const media = typeof m.media === 'string' ? JSON.parse(m.media) : m.media;
                        return media.map((file, i) => (
                          <a key={i} href={`http://localhost:3001${file.file_url}`} target="_blank" rel="noreferrer"
                            className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden hover:ring-2 ring-primary-500">
                            {file.media_type === 'image' ? (
                              <img src={`http://localhost:3001${file.file_url}`} alt={file.file_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-gray-500">
                                <Video size={20} />
                                <span className="text-xs truncate max-w-full px-1">{file.file_name}</span>
                              </div>
                            )}
                          </a>
                        ));
                      })()}
                    </div>
                  )}

                  {/* FAQs */}
                  {m.faqs && (() => {
                    try {
                      const faqs = JSON.parse(m.faqs);
                      return (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">FAQs</h4>
                          <div className="space-y-2">
                            {faqs.map((faq, i) => (
                              <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                                <p className="font-medium text-gray-800">Q: {faq.question}</p>
                                <p className="text-gray-600 mt-1">A: {faq.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Edit2, Package, Upload, Loader2, ChevronDown, ChevronUp, Image, Video, X, Trash2 } from 'lucide-react';
import { formatINR } from '../utils';
import CatalogueWAModal from '../components/catalogue/CatalogueWAModal';

export default function Machines() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMachine, setEditMachine] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [waTarget, setWaTarget] = useState(null);

  const emptyForm = {
    model_name: '', category: '', price: '', gst_percent: 18, description: '',
    specifications: {}, faqs: [], is_active: true
  };
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
    try {
      const specs = typeof m.specifications === 'string' ? JSON.parse(m.specifications || '{}') : m.specifications || {};
      const faqs = typeof m.faqs === 'string' ? JSON.parse(m.faqs || '[]') : m.faqs || [];
      setForm({
        model_name: m.model_name,
        category: m.category || '',
        price: m.price || '',
        gst_percent: m.gst_percent || 18,
        description: m.description || '',
        specifications: specs,
        faqs: faqs,
        is_active: !!m.is_active
      });
    } catch {
      setForm({
        model_name: m.model_name, category: m.category || '', price: m.price || '',
        gst_percent: m.gst_percent || 18, description: m.description || '',
        specifications: {}, faqs: [], is_active: !!m.is_active
      });
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (m) => {
    await api.put(`/machines/${m.id}`, { is_active: !m.is_active });
    await loadMachines();
    toast.success(m.is_active ? 'Machine deactivated' : 'Machine activated');
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete "${m.model_name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/machines/${m.id}`);
      toast.success('Machine deleted!');
      await loadMachines();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Delete failed';
      console.error('Delete error:', err);
      toast.error(errMsg);
    }
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

  if (!isAdmin) {
    return (
      <div style={{ background: '#F4F5F7', minHeight: '100vh' }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Machine Catalogue</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4, margin: 0 }}>Browse and share machines on WhatsApp</p>
        </div>

        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 size={32} className="animate-spin text-blue-600" style={{ margin: '0 auto' }} />
            </div>
          ) : machines.filter(m => m.is_active).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
              <Package size={48} style={{ margin: '0 auto 16px', color: '#D1D5DB' }} />
              <p>No active machines yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {machines.filter(m => m.is_active).map(machine => (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  onSendWA={() => setWaTarget(machine)}
                  onViewDetails={() => navigate(`/machines/${machine.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        <CatalogueWAModal
          machine={waTarget}
          open={!!waTarget}
          onClose={() => setWaTarget(null)}
        />
      </div>
    );
  }

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

            <div className="sm:col-span-2">
              <label className="label">Specifications (JSON)</label>
              <textarea
                className="input"
                rows={4}
                placeholder='{"Power": "2000W", "Warranty": "2 Years"}'
                value={typeof form.specifications === 'string' ? form.specifications : JSON.stringify(form.specifications)}
                onChange={e => {
                  try {
                    setForm(f => ({ ...f, specifications: JSON.parse(e.target.value) }));
                  } catch {
                    setForm(f => ({ ...f, specifications: e.target.value }));
                  }
                }}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">FAQs (JSON)</label>
              <textarea
                className="input"
                rows={4}
                placeholder='[{"question": "Warranty?", "answer": "2 years"}]'
                value={typeof form.faqs === 'string' ? form.faqs : JSON.stringify(form.faqs)}
                onChange={e => {
                  try {
                    setForm(f => ({ ...f, faqs: JSON.parse(e.target.value) }));
                  } catch {
                    setForm(f => ({ ...f, faqs: e.target.value }));
                  }
                }}
              />
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
                      <button onClick={() => handleEdit(m)} className="p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(m)} className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 size={16} />
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

function MachineCard({ machine, onSendWA, onViewDetails }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Machine thumbnail */}
      {machine.firstImage ? (
        <img
          src={`http://localhost:3001${machine.firstImage}`}
          alt={machine.model_name}
          style={{ width: '100%', height: 160, objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: 160,
            background: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            color: '#D1D5DB',
          }}
        >
          🖨️
        </div>
      )}

      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
          {machine.model_name}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
          {machine.category}
        </div>

        {machine.price && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#1B3A6B',
              marginTop: 6,
            }}
          >
            ₹{Number(machine.price).toLocaleString('en-IN')}
            <span style={{ fontSize: 10, fontWeight: 400, color: '#6B7280' }}>
              {' '}+ GST
            </span>
          </div>
        )}

        {/* Media count badges */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {machine.imageCount > 0 && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 10,
                background: '#EEF2FF',
                color: '#534AB7',
                fontWeight: 600,
              }}
            >
              📸 {machine.imageCount}
            </span>
          )}
          {machine.videoCount > 0 && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 10,
                background: '#FEE2E2',
                color: '#991B1B',
                fontWeight: 600,
              }}
            >
              🎥 {machine.videoCount}
            </span>
          )}
        </div>

        {/* Description */}
        {machine.description && (
          <p
            style={{
              fontSize: 11,
              color: '#6B7280',
              marginTop: 8,
              marginBottom: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {machine.description}
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
          {/* View details */}
          <button
            onClick={onViewDetails}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 8,
              border: '1.5px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Details
          </button>

          {/* WhatsApp send — main button */}
          <button
            onClick={onSendWA}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: '#25D366',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

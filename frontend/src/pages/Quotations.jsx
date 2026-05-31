import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Plus, FileText, Loader2, Download } from 'lucide-react';
import { formatINR, formatDate } from '../utils';

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
    api.get('/quotations').then(r => { setQuotations(r.data); setLoading(false); });
  }, []);

  const handleGeneratePdf = async (q) => {
    setGenerating(q.id);
    try {
      const { data } = await api.post(`/quotations/${q.id}/generate-pdf`);
      window.open(`http://localhost:3001${data.pdf_url}`, '_blank');
      toast.success('PDF ready!');
    } catch { toast.error('PDF generation failed'); }
    finally { setGenerating(null); }
  };

  const statusColor = (s) => ({
    draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700'
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Quotations</h2>
        <Link to="/quotations/new" className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> New Quote
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-primary-700" /></div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-16 card">
          <FileText size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No quotations yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quotations.map(q => (
            <div key={q.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{q.quote_number}</p>
                    <span className={`badge ${statusColor(q.status)}`}>{q.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{q.lead_name} {q.lead_city ? `• ${q.lead_city}` : ''}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(q.created_at)} • Valid {q.validity_days} days</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">{formatINR(q.total_amount)}</p>
                  <button
                    onClick={() => handleGeneratePdf(q)}
                    disabled={generating === q.id}
                    className="flex items-center gap-1 text-xs text-primary-700 hover:underline mt-1"
                  >
                    {generating === q.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

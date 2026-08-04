import { useState, useEffect } from 'react';
import BottomSheet from '../ui/BottomSheet';
import api from '../../api';
import toast from 'react-hot-toast';

export default function SendWAModal({ machine, open, onClose }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [language, setLanguage] = useState('hindi');
  const [includeFAQs, setIncludeFAQs] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (!open || !search) {
      setLeads([]);
      return;
    }
    api
      .get(`/leads?search=${search}&limit=30`)
      .then((res) => {
        setLeads(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setLeads([]));
  }, [search, open]);

  async function generate() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await api.post(`/machines/${machine.id}/whatsapp-message`, {
        lead_id: selected.id,
        language,
        include_faqs: includeFAQs,
      });
      if (res.data.success) {
        setResult(res.data);
      }
    } catch (err) {
      toast.error('Failed to generate message');
      console.error(err);
    }
    setLoading(false);
  }

  function reset() {
    setSearch('');
    setSelected(null);
    setResult(null);
    setOpened(false);
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="📲 WhatsApp pe Bhejo"
    >
      {/* Machine summary */}
      <div
        style={{
          background: '#EEF2FF',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 28 }}>🖨️</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {machine?.model_name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#6B7280',
              marginTop: 2,
              display: 'flex',
              gap: 10,
            }}
          >
            {machine?.price && (
              <span>₹{Number(machine.price).toLocaleString('en-IN')}</span>
            )}
            {machine?.imageCount > 0 && <span>📸 {machine.imageCount}</span>}
            {machine?.videoCount > 0 && <span>🎥 {machine.videoCount}</span>}
          </div>
        </div>
      </div>

      {/* Show customer picker if no result */}
      {!result && (
        <>
          {/* Customer search */}
          <div style={{ marginBottom: 10 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Kisko bhejna hai? *
            </label>
            <div
              style={{
                background: '#F4F5F7',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <span>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Naam ya phone se search karo..."
                style={{
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: 14,
                }}
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Selected badge */}
          {selected && (
            <div
              style={{
                background: '#DCFCE7',
                border: '1.5px solid #10B981',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  ✓ {selected.name}
                </div>
                <div style={{ fontSize: 12, color: '#0F6E56' }}>
                  📞 {selected.phone}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#9CA3AF',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Leads list */}
          {!selected && (
            <div
              style={{
                maxHeight: 220,
                overflowY: 'auto',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              {leads.length === 0 ? (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#9CA3AF',
                    fontSize: 13,
                  }}
                >
                  {search ? 'Koi customer nahi mila' : 'Search to get started'}
                </div>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => {
                      setSelected(lead);
                      setSearch('');
                    }}
                    style={{
                      padding: '11px 14px',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      background: '#fff',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        background: '#F3F4F6',
                        color: '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {lead.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {lead.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                        {lead.phone}
                        {lead.city ? ` · ${lead.city}` : ''}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Options row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {/* Language */}
            <div style={{ flex: 1, display: 'flex', gap: 6 }}>
              {[
                { key: 'hindi', label: '🇮🇳 Hindi' },
                { key: 'english', label: '🇬🇧 English' },
              ].map((l) => (
                <button
                  key={l.key}
                  onClick={() => setLanguage(l.key)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: 'none',
                    background:
                      language === l.key ? '#1B3A6B' : '#F3F4F6',
                    color:
                      language === l.key ? '#fff' : '#374151',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Include FAQs toggle */}
            {machine?.faqs?.length > 0 && (
              <button
                onClick={() => setIncludeFAQs((f) => !f)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: includeFAQs ? '#FEF3C7' : '#F3F4F6',
                  color: includeFAQs ? '#92400E' : '#6B7280',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {includeFAQs ? '✓ FAQs' : '+ FAQs'}
              </button>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={!selected || loading}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 12,
              border: 'none',
              background:
                !selected || loading ? '#9CA3AF' : '#25D366',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              cursor: !selected || loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading
              ? '⏳ Message ban raha hai...'
              : selected
                ? `📲 ${selected.name} ko Bhejo`
                : 'Pehle customer chunno'}
          </button>
        </>
      )}

      {/* Show message preview + send */}
      {result && (
        <>
          {/* To: customer */}
          <div
            style={{
              background: '#DCFCE7',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                To: {selected?.name}
              </div>
              <div style={{ fontSize: 12, color: '#0F6E56' }}>
                📞 {selected?.phone}
              </div>
            </div>
            <button
              onClick={() => {
                setResult(null);
              }}
              style={{
                fontSize: 12,
                color: '#6B7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ← Change
            </button>
          </div>

          {/* Media reminder */}
          {(result.imageCount > 0 || result.videoCount > 0) && (
            <div
              style={{
                background: '#FEF3C7',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 12,
                fontSize: 13,
                color: '#92400E',
                lineHeight: 1.5,
              }}
            >
              📎 <strong>Yaad rahe:</strong> WhatsApp khulne ke baad{' '}
              {result.imageCount > 0 && `${result.imageCount} photo`}
              {result.imageCount > 0 && result.videoCount > 0 && ' + '}
              {result.videoCount > 0 && `${result.videoCount} video`}
              {' '}
              gallery se attach karna hai — phir Send dabao.
            </div>
          )}

          {/* Message preview */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1.5px solid #25D366',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#25D366',
                marginBottom: 8,
              }}
            >
              📱 Message Preview
            </div>
            <pre
              style={{
                fontSize: 12.5,
                color: '#111827',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                fontFamily: 'inherit',
                lineHeight: 1.7,
              }}
            >
              {result.message}
            </pre>
          </div>

          {/* Open WhatsApp */}
          <a
            href={result.waLink}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpened(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              height: 54,
              borderRadius: 12,
              background: '#25D366',
              color: '#fff',
              fontSize: 16,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {opened ? '✓ Phir se Open Karo' : 'WhatsApp Kholo aur Bhejo'}
          </a>

          {opened && (
            <p
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: '#10B981',
                fontWeight: 600,
                marginTop: 10,
              }}
            >
              ✓ WhatsApp khul gaya — photos/videos attach karo aur Send
              dabao
            </p>
          )}
        </>
      )}
    </BottomSheet>
  );
}

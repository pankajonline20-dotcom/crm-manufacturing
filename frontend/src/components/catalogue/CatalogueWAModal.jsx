import { useState, useEffect } from 'react';
import BottomSheet from '../ui/BottomSheet';
import api from '../../api';
import toast from 'react-hot-toast';

const useFetch = (url) => {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!url) return;
    api.get(url).then(res => {
      setData(Array.isArray(res.data) ? res.data : []);
    }).catch(() => setData([]));
  }, [url]);
  return { data };
};

export default function CatalogueWAModal({ machine, open, onClose }) {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [language, setLanguage] = useState('hindi');
  const [waLink, setWaLink] = useState('');
  const [preview, setPreview] = useState('');
  const [mediaCount, setMediaCount] = useState({ images: 0, videos: 0 });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: leads = [] } = useFetch(
    open && search.length >= 2 ? `/api/leads?q=${search}&limit=20` : (open ? '/api/leads?limit=20' : null)
  );

  async function generateLink() {
    if (!selectedLead || !machine) return;
    setLoading(true);
    try {
      const res = await api.post(`/machines/${machine.id}/whatsapp-share`, {
        lead_id: selectedLead.id,
        language,
      });
      if (res.data.success) {
        setWaLink(res.data.waLink);
        setPreview(res.data.previewMessage);
        setMediaCount(res.data.mediaCount || { images: 0, videos: 0 });
        setStep(2);
      }
    } catch (err) {
      toast.error('Failed to generate message');
    }
    setLoading(false);
  }

  function reset() {
    setStep(1);
    setSearch('');
    setSelectedLead(null);
    setWaLink('');
    setPreview('');
    setSent(false);
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="📲 Send on WhatsApp"
    >
      {/* Machine info header */}
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
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#1B3A6B',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          🖨️
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{machine?.model_name}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            {machine?.category}
            {machine?.price && ` · ₹${Number(machine.price).toLocaleString('en-IN')}`}
          </div>
          {(machine?.imageCount > 0 || machine?.videoCount > 0) && (
            <div style={{ fontSize: 11, color: '#534AB7', marginTop: 2 }}>
              {machine?.imageCount > 0 && `📸 ${machine.imageCount} photos `}
              {machine?.videoCount > 0 && `🎥 ${machine.videoCount} videos`}
            </div>
          )}
        </div>
      </div>

      {/* ─── STEP 1: Pick customer ─── */}
      {step === 1 && (
        <>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Customer chunno *
          </label>

          {/* Search */}
          <div
            style={{
              background: '#F4F5F7',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Naam ya phone number se search karo..."
              style={{
                border: 'none',
                background: 'none',
                outline: 'none',
                flex: 1,
                fontSize: 14,
              }}
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

          {/* Selected customer display */}
          {selectedLead && (
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
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedLead.name}</div>
                <div style={{ fontSize: 12, color: '#0F6E56' }}>📞 {selectedLead.phone}</div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Lead list */}
          <div
            style={{
              maxHeight: 280,
              overflowY: 'auto',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
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
                Koi customer nahi mila
              </div>
            ) : (
              leads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    background: selectedLead?.id === lead.id ? '#F0FDF4' : '#fff',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    transition: 'background 150ms',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: selectedLead?.id === lead.id ? '#10B981' : '#F3F4F6',
                      color: selectedLead?.id === lead.id ? '#fff' : '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {lead.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      📞 {lead.phone}
                      {lead.city && ` · 📍 ${lead.city}`}
                    </div>
                  </div>
                  {selectedLead?.id === lead.id && (
                    <span style={{ color: '#10B981', fontSize: 18 }}>✓</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Language toggle */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {[
              { key: 'hindi', label: '🇮🇳 Hindi' },
              { key: 'english', label: '🇬🇧 English' },
            ].map((l) => (
              <button
                key={l.key}
                onClick={() => setLanguage(l.key)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: language === l.key ? '#1B3A6B' : '#F3F4F6',
                  color: language === l.key ? '#fff' : '#374151',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={generateLink}
            disabled={!selectedLead || loading}
            style={{
              width: '100%',
              height: 50,
              marginTop: 14,
              borderRadius: 12,
              background: !selectedLead || loading ? '#9CA3AF' : '#25D366',
              color: '#fff',
              border: 'none',
              fontSize: 15,
              fontWeight: 700,
              cursor: !selectedLead || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Message bana raha hoon...' : '📝 Message Generate Karo →'}
          </button>
        </>
      )}

      {/* ─── STEP 2: Preview + Send ─── */}
      {step === 2 && (
        <>
          {/* Back button */}
          <button
            onClick={() => setStep(1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← Customer badlo
          </button>

          {/* Customer selected */}
          <div
            style={{
              background: '#DCFCE7',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 12,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: '#10B981',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {selectedLead?.name[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedLead?.name}</div>
              <div style={{ fontSize: 12, color: '#0F6E56' }}>📞 {selectedLead?.phone}</div>
            </div>
          </div>

          {/* Media reminder */}
          {(mediaCount.images > 0 || mediaCount.videos > 0) && (
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
              {mediaCount.images > 0 && `${mediaCount.images} photo`}
              {mediaCount.images > 0 && mediaCount.videos > 0 && ' aur '}
              {mediaCount.videos > 0 && `${mediaCount.videos} video`}
              {' '}
              manually attach karna hai Send se pehle.
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
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#25D366',
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>📱 Message Preview</span>
              <button
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                ✏️ Edit
              </button>
            </div>
            <pre
              style={{
                fontSize: 12,
                color: '#111827',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                fontFamily: 'inherit',
                lineHeight: 1.7,
              }}
            >
              {preview}
            </pre>
          </div>

          {/* Send button */}
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            onClick={() => setSent(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              height: 54,
              borderRadius: 12,
              background: '#25D366',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {sent ? '✓ Phir se open karo' : 'WhatsApp pe Bhejo'}
          </a>

          {sent && (
            <p
              style={{
                textAlign: 'center',
                color: '#10B981',
                fontSize: 13,
                fontWeight: 600,
                marginTop: 10,
              }}
            >
              ✓ Log ho gaya — ab photos/videos attach karo aur Send dabaao
            </p>
          )}
        </>
      )}
    </BottomSheet>
  );
}

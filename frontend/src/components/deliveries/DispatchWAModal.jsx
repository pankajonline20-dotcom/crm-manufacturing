import { useState } from 'react';
import BottomSheet from '../../components/ui/BottomSheet';

export default function DispatchWAModal({ delivery, open, onClose }) {
  const [language, setLanguage] = useState('hindi');
  const [transporterPhone, setTransporterPhone] = useState('');
  const [waLink, setWaLink] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function generate() {
    if (!transporterPhone.trim()) {
      alert('Transporter number daalo');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${delivery.id}/whatsapp-dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('crm_token')}`,
        },
        body: JSON.stringify({ language, transporter_phone: transporterPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setWaLink(data.waLink);
        setPreview(data.previewMessage);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  }

  function openWA() {
    window.open(waLink, '_blank');
    setSent(true);
  }

  function handleClose() {
    setWaLink('');
    setPreview('');
    setSent(false);
    setTransporterPhone('');
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="🚚 Dispatch WhatsApp">
      {/* Customer + Machine info */}
      <div
        style={{
          background: '#E1F5EE',
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
            borderRadius: 22,
            background: '#0F6E56',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {delivery?.customer_name?.[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{delivery?.customer_name}</div>
          <div style={{ fontSize: 13, color: '#0F6E56' }}>📞 {delivery?.customer_phone}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>📦 {delivery?.machine_name}</div>
        </div>
      </div>

      {/* Language toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { key: 'hindi', label: '🇮🇳 Hindi' },
          { key: 'english', label: '🇬🇧 English' },
        ].map((l) => (
          <button
            key={l.key}
            onClick={() => {
              setLanguage(l.key);
              setWaLink('');
              setPreview('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              border: 'none',
              background: language === l.key ? '#25D366' : '#F3F4F6',
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

      {/* Transporter phone field */}
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
        Transporter Number *
      </label>
      <input
        value={transporterPhone}
        onChange={(e) => {
          setTransporterPhone(e.target.value);
          setWaLink('');
          setPreview('');
        }}
        placeholder="Transporter ka phone number"
        type="tel"
        style={{
          width: '100%',
          borderRadius: 10,
          border: '1.5px solid #E5E7EB',
          padding: '12px 14px',
          fontSize: 15,
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />

      <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
        💡 Message mein machine ka naam aur aaj ki date auto aa jaayegi. Bilty aur machine photo WhatsApp pe
        manually attach karna.
      </p>

      {/* Generate button */}
      {!waLink && (
        <button
          onClick={generate}
          disabled={loading}
          style={{
            width: '100%',
            height: 50,
            marginTop: 14,
            borderRadius: 12,
            background: loading ? '#9CA3AF' : '#1B3A6B',
            color: '#fff',
            border: 'none',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {loading ? '⏳ Generating...' : '📝 Generate Message'}
        </button>
      )}

      {/* Preview + Send */}
      {waLink && (
        <>
          <div
            style={{
              background: '#F0FDF4',
              border: '1.5px solid #25D366',
              borderRadius: 12,
              padding: 14,
              marginTop: 14,
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
                onClick={() => {
                  setWaLink('');
                  setPreview('');
                }}
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
                fontSize: 13,
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

          {/* Reminder to attach images */}
          <div
            style={{
              background: '#FEF3C7',
              borderRadius: 10,
              padding: '10px 14px',
              marginTop: 10,
              fontSize: 13,
              color: '#92400E',
              lineHeight: 1.5,
            }}
          >
            📎 <strong>Yaad rahe:</strong> WhatsApp khulne ke baad bilty ki photo aur machine ki photo manually attach
            karna hai Send se pehle.
          </div>

          {/* WhatsApp send button */}
          <button
            onClick={openWA}
            style={{
              width: '100%',
              height: 54,
              marginTop: 12,
              borderRadius: 12,
              background: '#25D366',
              color: '#fff',
              border: 'none',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <span>💬</span>
            {sent ? '✓ Phir se open karo' : 'WhatsApp pe Bhejo'}
          </button>

          {sent && (
            <p style={{ textAlign: 'center', color: '#10B981', fontSize: 13, fontWeight: 600, marginTop: 8 }}>
              ✓ Message ready — ab bilty + machine photo attach karo aur Send dabaao
            </p>
          )}
        </>
      )}
    </BottomSheet>
  );
}

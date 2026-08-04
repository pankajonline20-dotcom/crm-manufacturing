import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SendWAModal from '../components/catalogue/SendWAModal';
import toast from 'react-hot-toast';

export default function MachineDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [machine, setMachine] = useState(null);
  const [showSendWA, setShowSendWA] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get(`/machines/${id}/full`).then(res => {
      setMachine(res.data);
    }).catch(err => {
      toast.error('Failed to load machine');
      console.error(err);
    });
  }, [id]);

  if (!machine) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>
        ⏳ Loading...
      </div>
    );
  }

  const images = machine.media?.filter(m => m.media_type === 'image') || [];
  const videos = machine.media?.filter(m => m.media_type === 'video') || [];

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      await api.post(`/machines/${id}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded!`);
      // Refetch machine
      const res = await api.get(`/machines/${id}/full`);
      setMachine(res.data);
    } catch (err) {
      toast.error('Upload failed');
    }
    setUploading(false);
  }

  async function deleteMedia(mediaId) {
    if (!confirm('Delete this file?')) return;
    try {
      await api.delete(`/machines/media/${mediaId}`);
      toast.success('Deleted');
      const res = await api.get(`/machines/${id}/full`);
      setMachine(res.data);
    } catch {
      toast.error('Delete failed');
    }
  }

  return (
    <div style={{ background: '#F4F5F7', minHeight: '100vh', paddingBottom: 120 }}>
      {/* Header */}
      <div
        style={{
          background: '#fff',
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {machine.model_name}
          </h1>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
            {machine.category}
          </div>
        </div>
        {machine.price && (
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#1B3A6B',
              fontFamily: 'monospace',
            }}
          >
            ₹{Number(machine.price).toLocaleString('en-IN')}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Description */}
        {machine.description && (
          <p
            style={{
              fontSize: 14,
              color: '#6B7280',
              marginBottom: 20,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {machine.description}
          </p>
        )}

        {/* Specifications */}
        {Object.keys(machine.specs || {}).length > 0 && (
          <Section title="Specifications">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px 16px',
              }}
            >
              {Object.entries(machine.specs || {})
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: '#9CA3AF',
                        textTransform: 'capitalize',
                      }}
                    >
                      {k.replace(/_/g, ' ')}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#111827',
                        marginTop: 2,
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
            </div>
          </Section>
        )}

        {/* Media Section */}
        <Section
          title={`Media ${
            images.length + videos.length > 0
              ? `(${images.length} photos, ${videos.length} videos)`
              : ''
          }`}
        >
          {/* Upload area */}
          {isAdmin && (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #D1D5DB',
                borderRadius: 12,
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: uploading ? '#F0FDF4' : '#FAFAFA',
                marginBottom:
                  images.length + videos.length > 0 ? 16 : 0,
                transition: 'all 200ms',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>
                {uploading ? '⏳' : '📤'}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                {uploading ? 'Uploading...' : 'Upload photos / videos'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#9CA3AF',
                  marginTop: 4,
                }}
              >
                JPG, PNG, MP4 — multiple files at once
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Photos grid */}
          {images.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#6B7280',
                  marginBottom: 8,
                }}
              >
                📸 PHOTOS ({images.length})
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {images.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      position: 'relative',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={`http://localhost:3001${img.file_url}`}
                      alt={img.file_name}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onClick={() =>
                        window.open(
                          `http://localhost:3001${img.file_url}`,
                          '_blank'
                        )
                      }
                    />
                    {isAdmin && (
                      <button
                        onClick={() => deleteMedia(img.id)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Videos list */}
          {videos.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#6B7280',
                  marginBottom: 8,
                }}
              >
                🎥 VIDEOS ({videos.length})
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    style={{
                      background: '#F9FAFB',
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: '#EDE9FE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      🎥
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {vid.file_name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a
                        href={`http://localhost:3001${vid.file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12,
                          color: '#534AB7',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        ▶ Play
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => deleteMedia(vid.id)}
                          style={{
                            fontSize: 12,
                            color: '#EF4444',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {images.length === 0 &&
            videos.length === 0 &&
            !isAdmin && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 0',
                  color: '#9CA3AF',
                  fontSize: 13,
                }}
              >
                No media uploaded yet
              </div>
            )}
        </Section>

        {/* FAQs */}
        {machine.faqs?.length > 0 && (
          <Section title="FAQs">
            {machine.faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: '#F9FAFB',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#111827',
                    marginBottom: 4,
                  }}
                >
                  Q: {faq.question}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#6B7280',
                    lineHeight: 1.5,
                  }}
                >
                  A: {faq.answer}
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          padding: '12px 20px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          gap: 10,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* Media count badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F4F5F7',
            borderRadius: 10,
            padding: '0 14px',
            fontSize: 12,
            fontWeight: 600,
            color: '#6B7280',
            flexShrink: 0,
          }}
        >
          {images.length > 0 && <span>📸{images.length}</span>}
          {videos.length > 0 && <span>🎥{videos.length}</span>}
          {images.length === 0 && videos.length === 0 && (
            <span>No media</span>
          )}
        </div>

        {/* Main Button */}
        <button
          onClick={() => setShowSendWA(true)}
          style={{
            flex: 1,
            height: 50,
            borderRadius: 12,
            border: 'none',
            background: '#25D366',
            color: '#fff',
            fontWeight: 800,
            fontSize: 15,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp pe Bhejo
        </button>
      </div>

      {/* Send WA Modal */}
      <SendWAModal
        machine={{
          ...machine,
          imageCount: images.length,
          videoCount: videos.length,
        }}
        open={showSendWA}
        onClose={() => setShowSendWA(false)}
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 14px',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

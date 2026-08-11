import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#111827' }}>Access nahi hai</h2>
      <p style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }}>
        Yeh page sirf admin ke liye hai.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          marginTop: 20,
          padding: '12px 24px',
          borderRadius: 10,
          border: 'none',
          background: '#E8500A',
          color: '#fff',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Dashboard pe Jao
      </button>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function MobileHeader({ title, showBack = false, onBack, rightAction, subtitle }) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: subtitle ? 64 : 56,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 10,
      flexShrink: 0,
    }}>
      {showBack && (
        <button onClick={handleBack} style={{
          border: 'none', background: 'none', padding: '8px 8px 8px 0',
          cursor: 'pointer', color: 'var(--brand-primary)',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <ChevronLeft size={26} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0', fontWeight: 500 }}>{subtitle}</p>}
      </div>
      {rightAction && <div style={{ flexShrink: 0 }}>{rightAction}</div>}
    </header>
  );
}

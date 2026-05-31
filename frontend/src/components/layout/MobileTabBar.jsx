import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, MessageCircle, MoreHorizontal } from 'lucide-react';

const TABS = [
  { icon: Home,           label: 'Home',   path: '/' },
  { icon: Users,          label: 'Leads',  path: '/leads' },
  { icon: FileText,       label: 'Quotes', path: '/quotations' },
  { icon: MessageCircle,  label: 'AI Chat',path: '/chat', dot: true },
  { icon: MoreHorizontal, label: 'More',   path: '/more' },
];

export default function MobileTabBar({ followupCount = 0 }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      display: 'flex',
      zIndex: 900,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
    }}>
      {TABS.map(tab => {
        const Icon = tab.icon;
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, height: 60, border: 'none',
              background: 'none', cursor: 'pointer', padding: 0,
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
            }}
          >
            {/* Active indicator line */}
            {active && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 24, height: 2.5, borderRadius: '0 0 3px 3px',
                background: 'var(--brand-primary)',
              }} />
            )}

            <div style={{ position: 'relative' }}>
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                color={active ? 'var(--brand-primary)' : 'var(--text-muted)'}
              />
              {tab.dot && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 7, height: 7, background: '#10B981', borderRadius: '50%',
                  border: '1.5px solid var(--bg-surface)',
                }} />
              )}
              {tab.path === '/leads' && followupCount > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -8,
                  background: '#EF4444', color: '#fff',
                  fontSize: 9, fontWeight: 700,
                  padding: '1px 4px', borderRadius: 8,
                  minWidth: 14, textAlign: 'center',
                  lineHeight: '14px',
                }}>{followupCount > 9 ? '9+' : followupCount}</span>
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: active ? 700 : 500,
              color: active ? 'var(--brand-primary)' : 'var(--text-muted)',
              lineHeight: 1,
            }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

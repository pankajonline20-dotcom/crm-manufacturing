import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../store';
import MobileHeader from '../../components/layout/MobileHeader';
import { Package, CreditCard, Truck, BarChart2, LogOut, Sun, Moon, ChevronRight } from 'lucide-react';

export default function MobileMore() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, setTheme } = useStore();
  const navigate = useNavigate();

  const MENU = [
    { icon: Package, label: 'Machine Catalog', path: '/machines', color: '#8B5CF6' },
    { icon: CreditCard, label: 'Payment Tracker', path: '/payments', color: '#EC4899' },
    { icon: Truck, label: 'After-Sales', path: '/deliveries', color: '#14B8A6' },
    ...(isAdmin ? [{ icon: BarChart2, label: 'Reports', path: '/reports', color: '#F59E0B' }] : []),
  ];

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', paddingBottom: 80 }}>
      <MobileHeader title="More" />

      {/* Profile card */}
      <div style={{ margin: '12px 16px', background: 'var(--bg-surface)', borderRadius: 16, padding: '16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white' }}>
            {user?.name?.[0]}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)', background: 'var(--brand-primary-light)', borderRadius: 6, padding: '2px 8px', marginTop: 4, display: 'inline-block', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ margin: '0 16px', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {MENU.map((item, i) => {
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', width: '100%', background: 'none', border: 'none', borderBottom: i < MENU.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} style={{ color: item.color }} />
              </div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', textAlign: 'left' }}>{item.label}</span>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          );
        })}
      </div>

      {/* Dark mode toggle */}
      <div style={{ margin: '12px 16px', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(107,114,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'dark' ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#8B5CF6" />}
          </div>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', textAlign: 'left' }}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
          <div style={{ width: 44, height: 26, borderRadius: 13, background: theme === 'dark' ? 'var(--brand-primary)' : 'var(--border)', transition: 'background 200ms', position: 'relative' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: theme === 'dark' ? 21 : 3, transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </button>
      </div>

      {/* Logout */}
      <div style={{ margin: '0 16px', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <button onClick={() => { logout(); navigate('/login'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={18} color="#EF4444" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#EF4444', textAlign: 'left' }}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

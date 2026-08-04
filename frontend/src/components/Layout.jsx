import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Package, FileText, MessageCircle,
  CreditCard, Truck, BarChart2, LogOut, ChevronLeft, ChevronRight,
  Sun, Moon, Bell, Search, Plus, Zap, Radio, Target, TrendingUp, Heart, AlertCircle, Building2, BookOpen
} from 'lucide-react';
import { useState, useEffect } from 'react';
import CommandPalette from './CommandPalette';
import api from '../api';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/machines', icon: Package, label: 'Machine Catalog' },
  { to: '/quotations', icon: FileText, label: 'Quotations' },
  { to: '/chat', icon: MessageCircle, label: 'AI Assistant', dot: true },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/deliveries', icon: Truck, label: 'After-Sales' },
  { to: '/directory', icon: BookOpen, label: 'Directory' },
  { to: '/reports', icon: BarChart2, label: 'Reports', adminOnly: true },
  // CEO Modules (admin only)
  { to: '/goals', icon: Target, label: 'Goals', adminOnly: true },
  { to: '/bi', icon: TrendingUp, label: 'Intelligence', adminOnly: true },
  { to: '/broadcast', icon: Radio, label: 'WA Broadcast', adminOnly: true },
  { to: '/boardroom', icon: Building2, label: 'AI Boardroom', adminOnly: true, badge: 'AI' },
];

const MOBILE_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/chat', icon: MessageCircle, label: 'AI Chat' },
  { to: '/quotations', icon: FileText, label: 'Quotes' },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, setTheme, sidebarCollapsed, toggleSidebar, openCommandPalette } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [followups, setFollowups] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    api.get('/leads/today-followups').then(r => setFollowups(r.data)).catch(() => {});
  }, []);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const visibleNav = NAV.filter(n => !n.adminOnly || isAdmin);

  const sidebarW = sidebarCollapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        style={{ background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', position: 'relative', zIndex: 20 }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} color="white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.2, whiteSpace: 'nowrap' }}>Heat Press CRM</div>
                <div style={{ fontSize: 11, color: 'var(--text-sidebar)', marginTop: 1, whiteSpace: 'nowrap' }}>{user?.role === 'admin' ? 'Administrator' : 'Sales Agent'}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse button */}
        <button
          onClick={toggleSidebar}
          style={{ position: 'absolute', top: 24, right: -12, width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: 'var(--shadow-sm)' }}
          className="hidden md:flex"
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Search hint */}
        {!sidebarCollapsed && (
          <button onClick={openCommandPalette} style={{ margin: '12px 12px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 150ms' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
            <Search size={13} color="var(--text-sidebar)" />
            <span style={{ fontSize: 12, color: 'var(--text-sidebar)', flex: 1, textAlign: 'left' }}>Search...</span>
            <kbd style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px' }}>⌘K</kbd>
          </button>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {!sidebarCollapsed && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '8px 12px 4px', textTransform: 'uppercase' }}>Main Menu</div>}
          {visibleNav.map(item => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link key={item.to} to={item.to} className={`sidebar-item ${active ? 'active' : ''}`} title={sidebarCollapsed ? item.label : undefined}
                style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', marginBottom: 2 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Icon size={18} />
                  {item.dot && <span style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-primary)' }} />}
                </div>
                {!sidebarCollapsed && (
                  <motion.span initial={false} style={{ flex: 1, whiteSpace: 'nowrap', fontSize: 13 }}>{item.label}</motion.span>
                )}
                {!sidebarCollapsed && item.badge != null && (
                  <span style={{ background: 'var(--brand-primary)', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div className="sidebar-item" style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {user?.name?.[0] || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            )}
            {!sidebarCollapsed && (
              <button onClick={() => { logout(); navigate('/login'); }} style={{ padding: 4, borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Desktop Header */}
        <header className="hidden md:flex" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 56, alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={openCommandPalette} style={{ flex: 1, maxWidth: 320, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'text' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1, textAlign: 'left' }}>Search anything...</span>
            <kbd style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px' }}>⌘K</kbd>
          </button>

          <div style={{ flex: 1 }} />

          {/* Dark mode */}
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(!notifOpen)} style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative' }}>
              <Bell size={15} />
              {followups.length > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-primary)', border: '1.5px solid var(--bg-surface)' }} />}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 320, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Notifications</span>
                    <button onClick={() => setNotifOpen(false)} style={{ fontSize: 12, color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
                  </div>
                  {followups.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>🎉 All caught up!</div>
                  ) : (
                    <div>
                      <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Follow-ups</div>
                      {followups.slice(0, 5).map(lead => (
                        <Link key={lead.id} to={`/leads/${lead.id}`} onClick={() => setNotifOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', textDecoration: 'none', transition: 'background 100ms' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-app)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{lead.name[0]}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.city} · {lead.status}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add lead */}
          <Link to="/leads/new" className="btn-primary" style={{ gap: 6, padding: '6px 14px', fontSize: 13 }}>
            <Plus size={14} /> Add Lead
          </Link>
        </header>

        {/* Mobile header */}
        <header className="md:hidden" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', flex: 1 }}>Heat Press CRM</span>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 80 }} className="md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ height: '100%' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MOBILE_NAV.length}, 1fr)`, height: 60 }}>
            {MOBILE_NAV.map(item => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link key={item.to} to={item.to} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, textDecoration: 'none' }}>
                  <Icon size={20} style={{ color: active ? 'var(--brand-primary)' : 'var(--text-muted)', strokeWidth: active ? 2.5 : 1.8 }} />
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? 'var(--brand-primary)' : 'var(--text-muted)' }}>{item.label}</span>
                  {active && <span style={{ position: 'absolute', bottom: 'env(safe-area-inset-bottom, 0px)', width: 16, height: 2, borderRadius: 1, background: 'var(--brand-primary)' }} />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <CommandPalette />
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, Zap, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) navigate('/');
    else toast.error(result.error);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-app)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }} className="hidden lg:flex">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Zap size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: '0 0 12px', lineHeight: 1.2 }}>Heat Press CRM</h1>
          <p style={{ fontSize: 15, color: 'var(--text-sidebar)', lineHeight: 1.6, margin: 0 }}>
            Your complete sales workspace. Manage leads, send quotes, track payments — all in one place.
          </p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Track every lead from inquiry to delivery', 'AI-powered sales assistant in Hindi & English', 'Instant WhatsApp quotes with PDF generation'].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-sidebar)' }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Zap size={26} color="white" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Heat Press CRM</h2>
          </div>

          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 32px' }}>Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="admin@heatpresscrm.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} className="input" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', padding: '12px', fontSize: 14, marginTop: 8 }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--bg-app)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Demo Credentials</p>
            {[
              { role: 'Admin', email: 'admin@heatpresscrm.com', pass: 'admin123' },
              { role: 'Agent', email: 'rahul@heatpresscrm.com', pass: 'agent123' },
            ].map(c => (
              <button key={c.role} onClick={() => setForm({ email: c.email, password: c.pass })}
                style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer', borderBottom: c.role === 'Admin' ? '1px solid var(--border)' : 'none', marginBottom: c.role === 'Admin' ? 4 : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{c.role}: {c.email}</span>
                <span style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 700 }}>Use this →</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

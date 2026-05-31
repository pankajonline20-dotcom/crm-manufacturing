const STATUS_CONFIG = {
  new:         { label: 'New',         color: 'var(--status-new)',         bg: 'rgba(59,130,246,0.12)' },
  called:      { label: 'Called',      color: 'var(--status-called)',      bg: 'rgba(139,92,246,0.12)' },
  interested:  { label: 'Interested',  color: 'var(--status-interested)',  bg: 'rgba(245,158,11,0.12)' },
  quoted:      { label: 'Quoted',      color: 'var(--status-quoted)',      bg: 'rgba(236,72,153,0.12)' },
  negotiating: { label: 'Negotiating', color: 'var(--status-negotiating)', bg: 'rgba(20,184,166,0.12)' },
  won:         { label: 'Won',         color: 'var(--status-won)',         bg: 'rgba(16,185,129,0.12)' },
  lost:        { label: 'Lost',        color: 'var(--status-lost)',        bg: 'rgba(239,68,68,0.12)' },
};

export const STATUSES = Object.keys(STATUS_CONFIG);

export default function StatusBadge({ status, size = 'md' }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'var(--text-secondary)', bg: 'var(--border-subtle)' };
  const padding = size === 'sm' ? '2px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? 11 : 12;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding, borderRadius: 99, fontSize, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

const CONFIG = {
  hot:  { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', text: '🔥 Hot'  },
  warm: { bg: '#DCFCE7', color: '#14532D', dot: '#10B981', text: '♨ Warm' },
  cold: { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8', text: '❄ Cold' },
};

export default function ScoreBadge({ score, label, size = 'md' }) {
  const c = CONFIG[label] || CONFIG.cold;
  const padding = size === 'sm' ? '2px 8px' : '3px 10px';
  const fontSize = size === 'sm' ? 11 : 12;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding, borderRadius: 99,
      background: c.bg, color: c.color,
      fontSize, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
      {c.text}{score != null ? ` · ${score}` : ''}
    </span>
  );
}

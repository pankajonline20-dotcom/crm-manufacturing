const STATUS_CONFIG = {
  new:         { label: 'New',         color: 'bg-blue-100 text-blue-800' },
  called:      { label: 'Called',      color: 'bg-purple-100 text-purple-800' },
  interested:  { label: 'Interested',  color: 'bg-yellow-100 text-yellow-800' },
  quoted:      { label: 'Quoted',      color: 'bg-orange-100 text-orange-800' },
  negotiating: { label: 'Negotiating', color: 'bg-pink-100 text-pink-800' },
  won:         { label: 'Won',         color: 'bg-green-100 text-green-800' },
  lost:        { label: 'Lost',        color: 'bg-red-100 text-red-800' },
};

export const STATUSES = Object.keys(STATUS_CONFIG);

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`badge ${cfg.color}`}>{cfg.label}</span>
  );
}

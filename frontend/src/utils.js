export function formatINR(amount) {
  if (amount == null) return '—';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatPhone(phone) {
  if (!phone) return '—';
  return phone.replace(/(\d{5})(\d{5})/, '$1 $2');
}

export function waLink(phone, message = '') {
  const num = `91${phone.replace(/\D/g, '')}`;
  return `https://wa.me/${num}${message ? '?text=' + encodeURIComponent(message) : ''}`;
}

export const SOURCE_LABELS = {
  manual: 'Manual',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  referral: 'Referral',
  indiamart: 'IndiaMART',
};

export const LEAD_STATUSES = ['new','called','interested','quoted','negotiating','won','lost'];

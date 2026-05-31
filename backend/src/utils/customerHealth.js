function daysDiff(date1, date2) {
  if (!date1) return 999;
  return Math.floor((new Date(date2) - new Date(date1)) / (1000 * 60 * 60 * 24));
}

function calculateHealthScore(customer, payments) {
  let score = 60;

  const delays = customer.payment_delays || 0;
  if (delays === 0)     score += 20;
  else if (delays === 1) score -= 10;
  else if (delays >= 2) score -= 25;

  const allPaid = payments.every(p => p.status === 'received');
  if (allPaid && payments.length > 0) score += 10;

  const daysSinceInteraction = daysDiff(customer.last_interaction_at, new Date());
  if (daysSinceInteraction <= 30)     score += 10;
  else if (daysSinceInteraction > 90) score -= 25;
  else if (daysSinceInteraction > 60) score -= 15;

  const complaints = customer.complaints || 0;
  if (complaints >= 3) score -= 30;
  else if (complaints >= 1) score -= 20;

  if ((customer.referrals_given || 0) >= 1)  score += 15;
  if ((customer.repurchase_count || 0) >= 1) score += 20;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score >= 70 ? 'healthy' : score >= 40 ? 'at_risk' : 'churning';
  return { score, label };
}

module.exports = { calculateHealthScore };

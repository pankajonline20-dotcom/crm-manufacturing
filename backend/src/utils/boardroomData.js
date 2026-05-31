function getCRMSnapshot(db) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

  const totalLeads = db.prepare('SELECT COUNT(*) as n FROM leads').get().n;
  const newLeadsToday = db.prepare("SELECT COUNT(*) as n FROM leads WHERE date(created_at)=date('now')").get().n;
  const hotLeads = db.prepare("SELECT COUNT(*) as n FROM leads WHERE score_label='hot'").get().n;
  const overdueFollowups = db.prepare("SELECT COUNT(*) as n FROM leads WHERE next_followup_date < date('now') AND status NOT IN ('won','lost')").get().n;

  const pipelineByStage = db.prepare("SELECT status, COUNT(*) as count FROM leads WHERE status NOT IN ('won','lost') GROUP BY status").all();

  const revenueThisMonth = db.prepare("SELECT COALESCE(SUM(total_amount),0) as total FROM quotations WHERE status='accepted' AND strftime('%Y-%m',created_at)=?").get(thisMonth).total;
  const revenueLastMonth = db.prepare("SELECT COALESCE(SUM(total_amount),0) as total FROM quotations WHERE status='accepted' AND strftime('%Y-%m',created_at)=?").get(lastMonth).total;
  const revenueGrowth = revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0;

  const wonThisMonth = db.prepare("SELECT COUNT(*) as n FROM leads WHERE status='won' AND strftime('%Y-%m',updated_at)=?").get(thisMonth).n;
  const lostThisMonth = db.prepare("SELECT COUNT(*) as n FROM leads WHERE status='lost' AND strftime('%Y-%m',updated_at)=?").get(thisMonth).n;
  const conversionRate = (wonThisMonth + lostThisMonth) > 0 ? Math.round((wonThisMonth / (wonThisMonth + lostThisMonth)) * 100) : 0;

  const quotesThisMonth = db.prepare("SELECT COUNT(*) as n FROM quotations WHERE strftime('%Y-%m',created_at)=?").get(thisMonth).n;
  const avgDealSize = db.prepare("SELECT COALESCE(AVG(total_amount),0) as avg FROM quotations WHERE status='accepted' AND strftime('%Y-%m',created_at)=?").get(thisMonth).avg;

  const pendingPayments = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='pending'").get().total;

  const callsToday = db.prepare("SELECT COUNT(*) as n FROM call_logs WHERE date(called_at)=date('now')").get().n;
  const callsThisWeek = db.prepare("SELECT COUNT(*) as n FROM call_logs WHERE called_at >= datetime('now','-7 days')").get().n;

  const lostReasons = db.prepare("SELECT lost_reason, COUNT(*) as n FROM leads WHERE status='lost' AND lost_reason IS NOT NULL GROUP BY lost_reason ORDER BY n DESC LIMIT 3").all();

  const topMachines = db.prepare("SELECT items, COUNT(*) as deals, SUM(total_amount) as revenue FROM quotations WHERE status='accepted' GROUP BY items ORDER BY revenue DESC LIMIT 3").all().map(row => {
    let model = 'Unknown';
    try { model = JSON.parse(row.items)?.[0]?.model_name || 'Unknown'; } catch {}
    return { model, deals: row.deals, revenue: row.revenue };
  });

  const leadSources = db.prepare("SELECT source, COUNT(*) as n FROM leads WHERE strftime('%Y-%m',created_at)=? GROUP BY source").all(thisMonth);

  const agentActivity = db.prepare("SELECT u.name, COUNT(cl.id) as calls FROM call_logs cl JOIN users u ON cl.user_id=u.id WHERE cl.called_at >= datetime('now','-7 days') GROUP BY u.id ORDER BY calls DESC").all();

  // Outstanding quotes (sent but not accepted/rejected)
  const outstandingQuotes = db.prepare("SELECT COUNT(*) as n, COALESCE(SUM(total_amount),0) as value FROM quotations WHERE status='sent'").get();

  return {
    date: new Date().toISOString().slice(0, 10),
    leads: { total: totalLeads, newToday: newLeadsToday, hot: hotLeads, overdueFollowups },
    pipeline: { byStage: pipelineByStage },
    revenue: { thisMonth: revenueThisMonth, lastMonth: revenueLastMonth, growth: revenueGrowth },
    deals: { wonThisMonth, lostThisMonth, conversionRate, quotesThisMonth, avgDealSize },
    payments: { pending: pendingPayments },
    calls: { today: callsToday, thisWeek: callsThisWeek },
    lostReasons,
    topMachines,
    leadSources,
    agentActivity,
    outstandingQuotes: { count: outstandingQuotes.n, value: outstandingQuotes.value },
  };
}

module.exports = { getCRMSnapshot };

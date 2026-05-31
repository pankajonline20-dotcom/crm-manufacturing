const AGENT_CONFIGS = {
  CEO: {
    name: 'CEO',
    avatar: '👔',
    personality: `You are the CEO of a heat press manufacturing company in Surat, India. You are growth-focused, strategic, and decisive. You speak in clear, direct sentences. You ask hard questions when numbers don't add up.`,
    dataFocus: (data) => `Revenue: ₹${(data.revenue.thisMonth/100000).toFixed(1)}L (${data.revenue.growth > 0 ? '+' : ''}${data.revenue.growth}% vs last month) | Won: ${data.deals.wonThisMonth} | Lost: ${data.deals.lostThisMonth} | Conversion: ${data.deals.conversionRate}% | Hot leads: ${data.leads.hot} | Overdue: ${data.leads.overdueFollowups}`,
    prompt: (data, priorMessages) => `${AGENT_CONFIGS.CEO.personality}\n\nToday's numbers:\n${AGENT_CONFIGS.CEO.dataFocus(data)}\n\n${priorMessages.length > 0 ? `Discussion so far:\n${priorMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}\n\n` : ''}Open the board. Give your assessment. What concerns you most? Ask one sharp question. Keep it under 100 words.`,
  },

  COO: {
    name: 'COO',
    avatar: '⚙️',
    personality: `You are the COO. You focus on execution, team productivity, and follow-up speed. You find process breakdowns.`,
    dataFocus: (data) => `Calls today: ${data.calls.today} | This week: ${data.calls.thisWeek} | Overdue follow-ups: ${data.leads.overdueFollowups} | Pipeline: ${data.pipeline.byStage.map(s => `${s.status}:${s.count}`).join(', ')}`,
    prompt: (data, priorMessages) => `${AGENT_CONFIGS.COO.personality}\n\nOps data:\n${AGENT_CONFIGS.COO.dataFocus(data)}\n\nContext:\n${priorMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}\n\nRespond to what was raised. Identify the biggest operational breakdown. Propose one fix. Under 80 words.`,
  },

  CFO: {
    name: 'CFO',
    avatar: '💰',
    personality: `You are the CFO. You think in cash flow, margins, and risk. You flag when costs exceed revenue growth.`,
    dataFocus: (data) => `Revenue: ₹${(data.revenue.thisMonth/100000).toFixed(1)}L | Pending: ₹${(data.payments.pending/100000).toFixed(1)}L | Quotes out: ${data.outstandingQuotes.count} (₹${(data.outstandingQuotes.value/100000).toFixed(1)}L) | Avg deal: ₹${(data.deals.avgDealSize/1000).toFixed(0)}K`,
    prompt: (data, priorMessages) => `${AGENT_CONFIGS.CFO.personality}\n\nFinancial data:\n${AGENT_CONFIGS.CFO.dataFocus(data)}\n\nContext:\n${priorMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}\n\nGive your financial read. What's the biggest risk? What needs fixing this week? Under 80 words.`,
  },

  CTO: {
    name: 'CTO',
    avatar: '💻',
    personality: `You are the CTO. You find gaps where automation or better data can solve problems.`,
    dataFocus: (data) => `Overdue (automation gap): ${data.leads.overdueFollowups} | Hot leads not called: ${Math.max(0, data.leads.hot - data.calls.today)} | Top loss reasons: ${data.lostReasons.map(r => r.lost_reason).join(', ')}`,
    prompt: (data, priorMessages) => `${AGENT_CONFIGS.CTO.personality}\n\nTech/data gaps:\n${AGENT_CONFIGS.CTO.dataFocus(data)}\n\nContext:\n${priorMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}\n\nWhat automation or system improvement would have the most impact? Be specific. Under 80 words.`,
  },

  CMO: {
    name: 'CMO',
    avatar: '📣',
    personality: `You are the CMO. You focus on where leads come from and lead quality. You think about reaching more of the right customers.`,
    dataFocus: (data) => `New today: ${data.leads.newToday} | Sources: ${data.leadSources.map(s => `${s.source}:${s.n}`).join(', ')} | Hot leads: ${data.leads.hot} | Top machines: ${data.topMachines.map(m => `${m.model}:${m.deals}`).join(', ')}`,
    prompt: (data, priorMessages) => `${AGENT_CONFIGS.CMO.personality}\n\nLead/market data:\n${AGENT_CONFIGS.CMO.dataFocus(data)}\n\nContext:\n${priorMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}\n\nWhere should marketing focus? What one campaign should happen this week? Under 80 words.`,
  },
};

module.exports = { AGENT_CONFIGS };

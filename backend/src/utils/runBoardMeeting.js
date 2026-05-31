const Anthropic = require('@anthropic-ai/sdk');
const { getCRMSnapshot } = require('./boardroomData');
const { AGENT_CONFIGS } = require('./boardroomAgents');

async function runBoardMeeting(db, meetingType = 'daily') {
  const data = getCRMSnapshot(db);

  // Save KPI snapshot
  db.prepare(`
    INSERT INTO kpi_snapshots (total_leads, new_leads_today, revenue_this_month, revenue_last_month,
      conversion_rate, avg_deal_size, calls_today, quotes_sent_this_month,
      overdue_followups, won_this_month, lost_this_month, pending_payments, hot_leads_count)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    data.leads.total, data.leads.newToday,
    data.revenue.thisMonth, data.revenue.lastMonth,
    data.deals.conversionRate, data.deals.avgDealSize,
    data.calls.today, data.deals.quotesThisMonth,
    data.leads.overdueFollowups, data.deals.wonThisMonth, data.deals.lostThisMonth,
    data.payments.pending, data.leads.hot
  );

  // Create meeting
  const meeting = db.prepare(`
    INSERT INTO board_meetings (meeting_type, data_snapshot, status)
    VALUES (?, ?, 'running')
  `).run(meetingType, JSON.stringify(data));

  const meetingId = meeting.lastInsertRowid;
  const transcript = [];

  // Run agents sequentially
  const agentOrder = ['CEO', 'COO', 'CFO', 'CTO', 'CMO'];
  const client = new Anthropic();

  for (const agentName of agentOrder) {
    const agent = AGENT_CONFIGS[agentName];
    const prompt = agent.prompt(data, transcript);

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0].text;
      transcript.push({
        role: agentName,
        avatar: agent.avatar,
        content,
        timestamp: new Date().toISOString(),
      });

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Agent ${agentName} failed:`, err);
      throw err;
    }
  }

  // CEO closing + action items
  const closingPrompt = `${AGENT_CONFIGS.CEO.personality}

The board discussion is complete:
${transcript.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Data summary:
Revenue: ₹${(data.revenue.thisMonth/100000).toFixed(1)}L (${data.revenue.growth > 0 ? '+' : ''}${data.revenue.growth}%)
Overdue: ${data.leads.overdueFollowups} | Hot: ${data.leads.hot} | Pending payments: ₹${(data.payments.pending/100000).toFixed(1)}L
Conversion: ${data.deals.conversionRate}%

Close the meeting with:
1. One sentence executive summary
2. 3-5 action items in JSON:
[
  { "title": "...", "description": "...", "priority": "critical|high|medium", "owner": "CEO|COO|CFO|CTO|CMO", "due_date": "YYYY-MM-DD", "expected_outcome": "..." }
]

Respond with summary first, then JSON array only.`;

  try {
    const closingResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: closingPrompt }],
    });

    const closingText = closingResponse.content[0].text;
    const summaryLine = closingText.split('\n')[0];
    let actionItems = [];

    try {
      const jsonMatch = closingText.match(/\[[\s\S]*\]/);
      if (jsonMatch) actionItems = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse action items:', e);
    }

    transcript.push({
      role: 'CEO',
      avatar: '👔',
      content: summaryLine,
      type: 'closing',
      timestamp: new Date().toISOString(),
    });

    // Save action items
    for (const item of actionItems) {
      db.prepare(`
        INSERT INTO board_actions (meeting_id, title, description, priority, owner, due_date, expected_outcome)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        meetingId, item.title, item.description, item.priority, item.owner,
        item.due_date, item.expected_outcome
      );
    }

    // Mark meeting complete
    db.prepare(`
      UPDATE board_meetings
      SET status='complete', full_transcript=?, executive_summary=?, completed_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(JSON.stringify(transcript), summaryLine, meetingId);

    return { meetingId, transcript, actionItems, summary: summaryLine, data };
  } catch (err) {
    console.error('Closing prompt failed:', err);
    db.prepare('UPDATE board_meetings SET status=? WHERE id=?').run('failed', meetingId);
    throw err;
  }
}

module.exports = { runBoardMeeting };

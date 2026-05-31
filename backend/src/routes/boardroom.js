const express = require('express');
const { db } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { runBoardMeeting } = require('../utils/runBoardMeeting');

const router = express.Router();
router.use(authMiddleware);

// Run a meeting manually
router.post('/boardroom/run', adminOnly, async (req, res) => {
  const { type = 'daily' } = req.body;
  try {
    const result = await runBoardMeeting(db, type);
    res.json({ success: true, meetingId: result.meetingId });
  } catch (err) {
    console.error('Board meeting error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get meeting by ID
router.get('/boardroom/meetings/:id', async (req, res) => {
  const meeting = db.prepare('SELECT * FROM board_meetings WHERE id = ?').get(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Not found' });
  const actions = db.prepare('SELECT * FROM board_actions WHERE meeting_id = ?').all(req.params.id);
  res.json({
    ...meeting,
    full_transcript: meeting.full_transcript ? JSON.parse(meeting.full_transcript) : [],
    data_snapshot: meeting.data_snapshot ? JSON.parse(meeting.data_snapshot) : {},
    actions,
  });
});

// List all meetings
router.get('/boardroom/meetings', async (req, res) => {
  const meetings = db.prepare(
    'SELECT id, meeting_type, status, executive_summary, started_at, completed_at FROM board_meetings ORDER BY started_at DESC LIMIT 30'
  ).all();
  res.json(meetings);
});

// Get open action items
router.get('/boardroom/actions', adminOnly, async (req, res) => {
  const actions = db.prepare(
    "SELECT ba.*, bm.started_at as meeting_date FROM board_actions ba JOIN board_meetings bm ON ba.meeting_id=bm.id WHERE ba.status='open' ORDER BY CASE ba.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, ba.due_date ASC"
  ).all();
  res.json(actions);
});

// Update action status
router.put('/boardroom/actions/:id', adminOnly, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE board_actions SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true });
});

// KPI trend
router.get('/boardroom/kpi-trend', adminOnly, (req, res) => {
  const trend = db.prepare(
    'SELECT * FROM kpi_snapshots ORDER BY snapshot_date DESC LIMIT 30'
  ).all();
  res.json(trend.reverse());
});

// Live meeting stream (SSE)
router.get('/boardroom/meetings/:id/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const poll = setInterval(() => {
    const meeting = db.prepare('SELECT status, full_transcript FROM board_meetings WHERE id=?').get(req.params.id);
    if (!meeting) { clearInterval(poll); res.end(); return; }
    const transcript = meeting.full_transcript ? JSON.parse(meeting.full_transcript) : [];
    res.write(`data: ${JSON.stringify({ status: meeting.status, messageCount: transcript.length })}\n\n`);
    if (meeting.status === 'complete') { clearInterval(poll); res.end(); }
  }, 2000);

  req.on('close', () => clearInterval(poll));
});

module.exports = router;

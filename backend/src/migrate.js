const { db } = require('./database');

function runMigrations() {
  // Lead scoring columns
  const leadCols = db.prepare("PRAGMA table_info(leads)").all().map(c => c.name);
  if (!leadCols.includes('score'))             db.exec("ALTER TABLE leads ADD COLUMN score INTEGER DEFAULT 0");
  if (!leadCols.includes('score_updated_at'))  db.exec("ALTER TABLE leads ADD COLUMN score_updated_at DATETIME");
  if (!leadCols.includes('score_label'))       db.exec("ALTER TABLE leads ADD COLUMN score_label TEXT DEFAULT 'cold'");
  if (!leadCols.includes('lost_to_competitor'))db.exec("ALTER TABLE leads ADD COLUMN lost_to_competitor TEXT");
  if (!leadCols.includes('lost_reason'))       db.exec("ALTER TABLE leads ADD COLUMN lost_reason TEXT");
  if (!leadCols.includes('lost_their_price'))  db.exec("ALTER TABLE leads ADD COLUMN lost_their_price REAL");
  if (!leadCols.includes('lost_notes'))        db.exec("ALTER TABLE leads ADD COLUMN lost_notes TEXT");

  // Goals table
  db.exec(`CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    month TEXT NOT NULL,
    type TEXT NOT NULL,
    target_value REAL NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Broadcasts
  db.exec(`CREATE TABLE IF NOT EXISTS broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    message_template TEXT,
    segment_filters TEXT,
    sent_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS broadcast_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    broadcast_id INTEGER REFERENCES broadcasts(id),
    lead_id INTEGER REFERENCES leads(id),
    phone TEXT,
    personalised_message TEXT,
    status TEXT DEFAULT 'pending',
    wa_link TEXT,
    sent_at DATETIME
  )`);

  // Customer health
  db.exec(`CREATE TABLE IF NOT EXISTS customer_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER UNIQUE REFERENCES leads(id),
    health_score INTEGER DEFAULT 50,
    health_label TEXT DEFAULT 'healthy',
    last_interaction_at DATETIME,
    payment_delays INTEGER DEFAULT 0,
    complaints INTEGER DEFAULT 0,
    referrals_given INTEGER DEFAULT 0,
    repurchase_count INTEGER DEFAULT 0,
    score_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Board meetings
  db.exec(`CREATE TABLE IF NOT EXISTS board_meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    triggered_by TEXT DEFAULT 'manual',
    meeting_type TEXT DEFAULT 'daily',
    status TEXT DEFAULT 'running',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    data_snapshot TEXT,
    full_transcript TEXT,
    executive_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS board_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER REFERENCES board_meetings(id),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    owner TEXT NOT NULL,
    due_date DATE,
    expected_outcome TEXT,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS kpi_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_date DATE DEFAULT (date('now')),
    total_leads INTEGER,
    new_leads_today INTEGER,
    pipeline_value REAL,
    revenue_this_month REAL,
    revenue_last_month REAL,
    conversion_rate REAL,
    avg_deal_size REAL,
    calls_today INTEGER,
    quotes_sent_this_month INTEGER,
    overdue_followups INTEGER,
    won_this_month INTEGER,
    lost_this_month INTEGER,
    pending_payments REAL,
    hot_leads_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('Migrations applied.');
}

module.exports = { runMigrations };

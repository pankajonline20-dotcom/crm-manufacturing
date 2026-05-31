const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Wrapper to maintain better-sqlite3 API compatibility
class PreparedStatement {
  constructor(query) {
    this.query = query;
  }

  run(...params) {
    return pool.query(this.query, params).then(result => ({
      lastInsertRowid: result.rows[0]?.id || null,
      changes: result.rowCount
    })).catch(err => {
      console.error('Query error:', err, 'Query:', this.query, 'Params:', params);
      throw err;
    });
  }

  all(...params) {
    return pool.query(this.query, params).then(result => result.rows).catch(err => {
      console.error('Query error:', err, 'Query:', this.query);
      throw err;
    });
  }

  get(...params) {
    return pool.query(this.query, params).then(result => result.rows[0] || null).catch(err => {
      console.error('Query error:', err, 'Query:', this.query);
      throw err;
    });
  }
}

const db = {
  prepare: (query) => new PreparedStatement(query),
  exec: async (sql) => {
    try {
      await pool.query(sql);
    } catch (err) {
      console.error('Exec error:', err);
      throw err;
    }
  }
};

async function initializeDatabase() {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'agent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        city TEXT,
        source TEXT DEFAULT 'manual',
        requirement TEXT,
        status TEXT DEFAULT 'new',
        assigned_to INTEGER REFERENCES users(id),
        next_followup_date DATE,
        last_called_at TIMESTAMP,
        score INTEGER DEFAULT 0,
        score_updated_at TIMESTAMP,
        score_label TEXT DEFAULT 'cold',
        lost_to_competitor TEXT,
        lost_reason TEXT,
        lost_their_price REAL,
        lost_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS call_logs (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        user_id INTEGER REFERENCES users(id),
        notes TEXT,
        duration_minutes INTEGER,
        called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS machines (
        id SERIAL PRIMARY KEY,
        model_name TEXT NOT NULL,
        category TEXT,
        price REAL,
        gst_percent REAL DEFAULT 18,
        description TEXT,
        specifications TEXT,
        faqs TEXT,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS machine_media (
        id SERIAL PRIMARY KEY,
        machine_id INTEGER REFERENCES machines(id),
        file_name TEXT,
        file_url TEXT,
        media_type TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        user_id INTEGER REFERENCES users(id),
        quote_number TEXT UNIQUE,
        items TEXT NOT NULL,
        subtotal REAL,
        gst_amount REAL,
        total_amount REAL,
        payment_terms TEXT,
        validity_days INTEGER DEFAULT 15,
        notes TEXT,
        status TEXT DEFAULT 'sent',
        pdf_url TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        machine_id INTEGER REFERENCES machines(id),
        delivered_at DATE,
        installation_done INTEGER DEFAULT 0,
        followup_7day_sent INTEGER DEFAULT 0,
        followup_30day_sent INTEGER DEFAULT 0,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        quotation_id INTEGER REFERENCES quotations(id),
        amount REAL,
        payment_date DATE,
        mode TEXT,
        status TEXT DEFAULT 'pending',
        reminder_count INTEGER DEFAULT 0,
        last_reminder_at TIMESTAMP,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        machine_id INTEGER REFERENCES machines(id),
        topic TEXT,
        question TEXT,
        answer TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        month TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value REAL NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS broadcasts (
        id SERIAL PRIMARY KEY,
        name TEXT,
        message_template TEXT,
        segment_filters TEXT,
        sent_count INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS broadcast_logs (
        id SERIAL PRIMARY KEY,
        broadcast_id INTEGER REFERENCES broadcasts(id),
        lead_id INTEGER REFERENCES leads(id),
        phone TEXT,
        personalised_message TEXT,
        status TEXT DEFAULT 'pending',
        wa_link TEXT,
        sent_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customer_health (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER UNIQUE REFERENCES leads(id),
        health_score INTEGER DEFAULT 50,
        health_label TEXT DEFAULT 'healthy',
        last_interaction_at TIMESTAMP,
        payment_delays INTEGER DEFAULT 0,
        complaints INTEGER DEFAULT 0,
        referrals_given INTEGER DEFAULT 0,
        repurchase_count INTEGER DEFAULT 0,
        score_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS board_meetings (
        id SERIAL PRIMARY KEY,
        triggered_by TEXT DEFAULT 'manual',
        meeting_type TEXT DEFAULT 'daily',
        status TEXT DEFAULT 'running',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        data_snapshot TEXT,
        full_transcript TEXT,
        executive_summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS board_actions (
        id SERIAL PRIMARY KEY,
        meeting_id INTEGER REFERENCES board_meetings(id),
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        owner TEXT NOT NULL,
        due_date DATE,
        expected_outcome TEXT,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS kpi_snapshots (
        id SERIAL PRIMARY KEY,
        snapshot_date DATE DEFAULT CURRENT_DATE,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Database init error:', err.message);
  }
}

module.exports = { db, initializeDatabase };

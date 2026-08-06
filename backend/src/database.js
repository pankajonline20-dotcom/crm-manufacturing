const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_URL || './data/crm.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

class PreparedStatement {
  constructor(stmt) {
    this.stmt = stmt;
  }

  run(...params) {
    try {
      const result = this.stmt.run(...params);
      return {
        lastInsertRowid: result.lastInsertRowid,
        changes: result.changes
      };
    } catch (err) {
      console.error('Query error:', err);
      throw err;
    }
  }

  all(...params) {
    try {
      return this.stmt.all(...params);
    } catch (err) {
      console.error('Query error:', err);
      throw err;
    }
  }

  get(...params) {
    try {
      return this.stmt.get(...params) || null;
    } catch (err) {
      console.error('Query error:', err);
      throw err;
    }
  }
}

const db = {
  prepare: (query) => new PreparedStatement(sqlite.prepare(query)),
  exec: (sql) => {
    try {
      sqlite.exec(sql);
    } catch (err) {
      console.error('Exec error:', err);
      throw err;
    }
  }
};

function initializeDatabase() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'agent',
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        city TEXT,
        source TEXT DEFAULT 'manual',
        requirement TEXT,
        status TEXT DEFAULT 'new',
        assigned_to INTEGER REFERENCES users(id),
        next_followup_date DATE,
        last_called_at datetime,
        score INTEGER DEFAULT 0,
        score_updated_at datetime,
        score_label TEXT DEFAULT 'cold',
        lost_to_competitor TEXT,
        lost_reason TEXT,
        lost_their_price REAL,
        lost_notes TEXT,
        is_vip INTEGER DEFAULT 0,
        vip_note TEXT,
        vip_marked_at datetime,
        vip_marked_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS call_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER REFERENCES leads(id),
        user_id INTEGER REFERENCES users(id),
        notes TEXT,
        duration_minutes INTEGER,
        called_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER REFERENCES machines(id),
        file_name TEXT,
        file_url TEXT,
        media_type TEXT,
        uploaded_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        sent_at datetime,
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER REFERENCES leads(id),
        machine_id INTEGER REFERENCES machines(id),
        delivered_at DATE,
        installation_done INTEGER DEFAULT 0,
        followup_7day_sent INTEGER DEFAULT 0,
        followup_30day_sent INTEGER DEFAULT 0,
        notes TEXT,
        dispatched_at datetime,
        dispatch_email_sent INTEGER DEFAULT 0,
        dispatch_email_sent_at datetime,
        tracking_info TEXT,
        dispatch_notes TEXT,
        estimated_arrival_date DATE,
        transport_company TEXT,
        vehicle_number TEXT,
        driver_name TEXT,
        driver_phone TEXT,
        transporter_phone TEXT,
        wa_dispatch_sent INTEGER DEFAULT 0,
        wa_dispatch_sent_at datetime
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER REFERENCES leads(id),
        quotation_id INTEGER REFERENCES quotations(id),
        amount REAL,
        payment_date DATE,
        mode TEXT,
        status TEXT DEFAULT 'pending',
        reminder_count INTEGER DEFAULT 0,
        last_reminder_at datetime,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS knowledge_base (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER REFERENCES machines(id),
        topic TEXT,
        question TEXT,
        answer TEXT,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        month TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value REAL NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS broadcasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        message_template TEXT,
        segment_filters TEXT,
        sent_count INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        sent_at datetime,
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS broadcast_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        broadcast_id INTEGER REFERENCES broadcasts(id),
        lead_id INTEGER REFERENCES leads(id),
        phone TEXT,
        personalised_message TEXT,
        status TEXT DEFAULT 'pending',
        wa_link TEXT,
        sent_at datetime
      );

      CREATE TABLE IF NOT EXISTS customer_health (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER UNIQUE REFERENCES leads(id),
        health_score INTEGER DEFAULT 50,
        health_label TEXT DEFAULT 'healthy',
        last_interaction_at datetime,
        payment_delays INTEGER DEFAULT 0,
        complaints INTEGER DEFAULT 0,
        referrals_given INTEGER DEFAULT 0,
        repurchase_count INTEGER DEFAULT 0,
        score_updated_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS board_meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        triggered_by TEXT DEFAULT 'manual',
        meeting_type TEXT DEFAULT 'daily',
        status TEXT DEFAULT 'running',
        started_at datetime DEFAULT CURRENT_TIMESTAMP,
        completed_at datetime,
        data_snapshot TEXT,
        full_transcript TEXT,
        executive_summary TEXT,
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS board_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER REFERENCES board_meetings(id),
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        owner TEXT NOT NULL,
        due_date DATE,
        expected_outcome TEXT,
        status TEXT DEFAULT 'open',
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS kpi_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customer_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER REFERENCES leads(id),
        visitor_name TEXT NOT NULL,
        visitor_phone TEXT,
        visitor_company TEXT,
        visit_date DATE NOT NULL,
        visit_time TEXT,
        visit_purpose TEXT,
        machines_interested TEXT,
        assigned_to INTEGER REFERENCES users(id),
        status TEXT DEFAULT 'scheduled',
        visit_notes TEXT,
        outcome_notes TEXT,
        reminder_sent INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS directory_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_type TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        phone_2 TEXT,
        email TEXT,
        city TEXT,
        state TEXT DEFAULT 'Gujarat',
        address TEXT,
        company_name TEXT,
        customer_ref_number TEXT,
        machines_owned TEXT,
        engineer_specialization TEXT,
        engineer_availability TEXT,
        dealer_territory TEXT,
        dealer_commission_pct REAL,
        supplier_materials TEXT,
        supplier_lead_time TEXT,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        created_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_name TEXT DEFAULT 'Clerbulk Printing Machines',
        phone TEXT DEFAULT '9876543210',
        email TEXT,
        address TEXT,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_directory_type ON directory_contacts(contact_type);
      CREATE INDEX IF NOT EXISTS idx_directory_city ON directory_contacts(city);
      CREATE INDEX IF NOT EXISTS idx_directory_ref ON directory_contacts(customer_ref_number);
      CREATE INDEX IF NOT EXISTS idx_customer_visits_date ON customer_visits(visit_date);

      CREATE TABLE IF NOT EXISTS production_stages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER REFERENCES machines(id),
        order_id TEXT,
        stage TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        started_at datetime,
        completed_at datetime,
        worker_id INTEGER REFERENCES users(id),
        notes TEXT,
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_date DATE DEFAULT CURRENT_DATE,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        paid_by INTEGER REFERENCES users(id),
        payment_method TEXT DEFAULT 'cash',
        receipt_url TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS monthly_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        goal_type TEXT NOT NULL,
        target_value REAL NOT NULL,
        actual_value REAL DEFAULT 0,
        owner INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL,
        severity TEXT DEFAULT 'medium',
        title TEXT NOT NULL,
        message TEXT,
        entity_type TEXT,
        entity_id INTEGER,
        is_resolved INTEGER DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_production_stages_machine ON production_stages(machine_id);
      CREATE INDEX IF NOT EXISTS idx_production_stages_stage ON production_stages(stage);
      CREATE INDEX IF NOT EXISTS idx_daily_expenses_date ON daily_expenses(expense_date);
      CREATE INDEX IF NOT EXISTS idx_monthly_goals_month ON monthly_goals(month);
      CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(is_resolved);

      CREATE TABLE IF NOT EXISTS daily_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date DATE DEFAULT CURRENT_DATE,
        cash_in REAL DEFAULT 0,
        cash_out REAL DEFAULT 0,
        welding_completed INTEGER DEFAULT 0,
        sent_to_coating INTEGER DEFAULT 0,
        returned_from_coating INTEGER DEFAULT 0,
        fitting_completed INTEGER DEFAULT 0,
        testing_completed INTEGER DEFAULT 0,
        dispatch_count INTEGER DEFAULT 0,
        sales_calls INTEGER DEFAULT 0,
        orders_count INTEGER DEFAULT 0,
        remarks TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS finance_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date DATE DEFAULT CURRENT_DATE,
        type TEXT NOT NULL,
        customer_name TEXT,
        vendor_name TEXT,
        amount REAL NOT NULL,
        category TEXT,
        payment_mode TEXT,
        remarks TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS production_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date DATE DEFAULT CURRENT_DATE,
        machine_model TEXT,
        welding_done INTEGER DEFAULT 0,
        sent_to_coating INTEGER DEFAULT 0,
        returned_count INTEGER DEFAULT 0,
        pending INTEGER DEFAULT 0,
        remarks TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fitting_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date DATE DEFAULT CURRENT_DATE,
        machine TEXT,
        testing_completed INTEGER DEFAULT 0,
        passed INTEGER DEFAULT 0,
        failed INTEGER DEFAULT 0,
        ready_for_dispatch INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dispatch_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date DATE DEFAULT CURRENT_DATE,
        customer_name TEXT,
        machine_model TEXT,
        transport_company TEXT,
        lr_number TEXT,
        state TEXT,
        delivered INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date DATE DEFAULT CURRENT_DATE,
        sales_person_id INTEGER REFERENCES users(id),
        calls INTEGER DEFAULT 0,
        followups INTEGER DEFAULT 0,
        videos_sent INTEGER DEFAULT 0,
        quotations INTEGER DEFAULT 0,
        orders INTEGER DEFAULT 0,
        order_value REAL DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_date DATE DEFAULT CURRENT_DATE,
        customer_name TEXT NOT NULL,
        machine_model TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        amount REAL NOT NULL,
        advance REAL DEFAULT 0,
        status TEXT DEFAULT 'new',
        created_by INTEGER REFERENCES users(id),
        created_at datetime DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(entry_date);
      CREATE INDEX IF NOT EXISTS idx_finance_entries_date ON finance_entries(entry_date);
      CREATE INDEX IF NOT EXISTS idx_production_entries_date ON production_entries(entry_date);
      CREATE INDEX IF NOT EXISTS idx_fitting_entries_date ON fitting_entries(entry_date);
      CREATE INDEX IF NOT EXISTS idx_dispatch_entries_date ON dispatch_entries(entry_date);
      CREATE INDEX IF NOT EXISTS idx_sales_entries_date ON sales_entries(entry_date);
      CREATE INDEX IF NOT EXISTS idx_order_entries_date ON order_entries(order_date);
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Database init error:', err.message);
  }
}

module.exports = { db, initializeDatabase };

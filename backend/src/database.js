const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || './data/crm.db';
const dbDir = path.dirname(path.resolve(dbPath));

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.resolve(dbPath));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'agent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      last_called_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id),
      user_id INTEGER REFERENCES users(id),
      notes TEXT,
      duration_minutes INTEGER,
      called_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id),
      machine_id INTEGER REFERENCES machines(id),
      delivered_at DATE,
      installation_done INTEGER DEFAULT 0,
      followup_7day_sent INTEGER DEFAULT 0,
      followup_30day_sent INTEGER DEFAULT 0,
      notes TEXT
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
      last_reminder_at DATETIME,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id INTEGER REFERENCES machines(id),
      topic TEXT,
      question TEXT,
      answer TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { db, initializeDatabase };

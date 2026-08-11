require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./src/database');
const { seedDatabase } = require('./src/seed');
const { runMigrations } = require('./src/migrate');
const { startNightlyJobs } = require('./src/utils/nightlyJobs');
const { scheduleDailyBackup, backupDB } = require('./src/utils/backup');

const authRoutes = require('./src/routes/auth');
const leadsRoutes = require('./src/routes/leads');
const machinesRoutes = require('./src/routes/machines');
const quotationsRoutes = require('./src/routes/quotations');
const paymentsRoutes = require('./src/routes/payments');
const deliveriesRoutes = require('./src/routes/deliveries');
const chatRoutes = require('./src/routes/chat');
const reportsRoutes = require('./src/routes/reports');
const advancedRoutes = require('./src/routes/advanced');
const boardroomRoutes = require('./src/routes/boardroom');
const visitsRoutes = require('./src/routes/visits');
const directoryRoutes = require('./src/routes/directory');
const dashboardRoutes = require('./src/routes/dashboard');
const dailyEntriesRoutes = require('./src/routes/daily-entries');

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    /\.vercel\.app$/,
    'https://salessaathi.com',
    'https://www.salessaathi.com',
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/entries', dailyEntriesRoutes);
app.use('/api', advancedRoutes);
app.use('/api', boardroomRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API 404 handler — unknown API routes
app.use('/api', (req, res) => {
  console.log(`[404] API not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'API route not found',
    method: req.method,
    path: req.path,
  });
});

// Serve React frontend (production)
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// Catch-all: serve index.html for React Router
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  const fs = require('fs');

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CRM</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; }
            h2 { color: #E8500A; }
            p { color: #6B7280; }
          </style>
        </head>
        <body>
          <h2>Frontend build not found</h2>
          <p>Run: <code>npm run build</code> in frontend folder</p>
          <p>API is working! Try <a href="/api/health">/api/health</a></p>
        </body>
      </html>
    `);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 3001;

try {
  initializeDatabase();
  runMigrations();
  seedDatabase();

  // Initialize backup system
  backupDB();
  scheduleDailyBackup();

  app.listen(PORT, () => {
    console.log(`CRM Backend running on http://localhost:${PORT}`);
    startNightlyJobs();
  });
} catch (err) {
  console.error('Startup error:', err);
  process.exit(1);
}

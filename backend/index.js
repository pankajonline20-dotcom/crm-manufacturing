require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./src/database');
const { seedDatabase } = require('./src/seed');
const { runMigrations } = require('./src/migrate');
const { startNightlyJobs } = require('./src/utils/nightlyJobs');

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

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
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
app.use('/api', advancedRoutes);
app.use('/api', boardroomRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 3001;

initializeDatabase();
runMigrations();
seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`CRM Backend running on http://localhost:${PORT}`);
    startNightlyJobs();
  });
}).catch(console.error);

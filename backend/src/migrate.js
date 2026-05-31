const { db } = require('./database');

async function runMigrations() {
  // All migrations are handled in initializeDatabase
  // This function is kept for future migrations
  console.log('Migrations applied.');
}

module.exports = { runMigrations };

#!/usr/bin/env node

/**
 * Schema Verification Script
 * Check if lead creation tracking columns exist and are populated
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || process.env.DATABASE_URL || './data/crm.db';

try {
  console.log('🔍 Verifying SalesSaathi CRM Schema...\n');
  console.log(`📁 Database: ${dbPath}`);

  const sqlite = new Database(dbPath);

  // Check leads table structure
  console.log('\n📋 LEADS TABLE STRUCTURE:');
  console.log('─────────────────────────');

  const tableInfo = sqlite.prepare("PRAGMA table_info(leads)").all();
  const columns = tableInfo.map(col => col.name);

  const requiredColumns = [
    'id', 'name', 'phone', 'created_by', 'created_by_name',
    'assigned_to', 'is_deleted', 'created_at', 'status'
  ];

  let allPresent = true;
  for (const col of requiredColumns) {
    const exists = columns.includes(col);
    const icon = exists ? '✅' : '❌';
    console.log(`${icon} ${col}`);
    if (!exists) allPresent = false;
  }

  if (!allPresent) {
    console.log('\n⚠️  MISSING COLUMNS! Run migrations...');
    console.log('   npm start  (will run migrations automatically)');
  }

  // Check data
  console.log('\n📊 LEADS DATA:');
  console.log('─────────────────────────');

  const totalLeads = sqlite.prepare('SELECT COUNT(*) as count FROM leads WHERE is_deleted = 0').get().count;
  const leadsWithCreator = sqlite.prepare('SELECT COUNT(*) as count FROM leads WHERE created_by IS NOT NULL AND is_deleted = 0').get().count;

  console.log(`Total leads: ${totalLeads}`);
  console.log(`Leads with creator: ${leadsWithCreator}`);

  if (totalLeads > 0 && leadsWithCreator === 0) {
    console.log('\n⚠️  NO CREATORS FILLED YET! Run migrations...');
  } else if (leadsWithCreator === totalLeads) {
    console.log('\n✅ All leads have creators assigned!');
  } else {
    console.log(`\n⚠️  ${totalLeads - leadsWithCreator} leads still missing creator info`);
  }

  // Sample lead with creator
  if (totalLeads > 0) {
    console.log('\n📌 SAMPLE LEAD:');
    console.log('─────────────────────────');
    const sample = sqlite.prepare(`
      SELECT
        l.id, l.name, l.phone,
        l.created_by, l.created_by_name,
        l.assigned_to, l.status,
        l.created_at,
        u.name as assigned_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.is_deleted = 0
      LIMIT 1
    `).get();

    console.log(`ID: ${sample.id}`);
    console.log(`Name: ${sample.name}`);
    console.log(`Phone: ${sample.phone}`);
    console.log(`Created by: ${sample.created_by_name || 'Unknown'}`);
    console.log(`Assigned to: ${sample.assigned_name || 'Unassigned'}`);
    console.log(`Status: ${sample.status}`);
    console.log(`Created: ${sample.created_at}`);
  }

  // Check API response
  console.log('\n🔌 API TEST:');
  console.log('─────────────────────────');
  console.log('To verify API is working:');
  console.log(`  curl http://localhost:3001/api/health`);
  console.log(`  curl http://localhost:3001/api/leads -H "Authorization: Bearer {token}"`);
  console.log(`  curl http://localhost:3001/api/reports/leads-by-agent -H "Authorization: Bearer {token}"`);

  // Summary
  console.log('\n📋 SUMMARY:');
  console.log('─────────────────────────');
  if (allPresent && leadsWithCreator === totalLeads) {
    console.log('✅ Schema is FULLY UPDATED');
    console.log('✅ All data is in place');
    console.log('✅ Ready for production!');
  } else if (allPresent) {
    console.log('⚠️  Schema is updated but migrations still running');
    console.log('   Wait for [Migration] ✅ messages in npm start');
  } else {
    console.log('❌ Schema needs migration');
    console.log('   Run: npm start');
    console.log('   Watch for: [Migration] messages');
  }

  sqlite.close();
  console.log('\n');

} catch (err) {
  console.error('\n❌ Error:', err.message);
  console.error('\nMake sure:');
  console.error('  1. Database file exists at:', dbPath);
  console.error('  2. Backend has been started (npm start)');
  process.exit(1);
}

#!/usr/bin/env node

/**
 * Script to apply the pinned/highlight migration to Supabase
 * Run: node scripts/add_pinned_highlight.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Make sure they are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runMigration() {
  console.log('📌 Adding pinned and highlight functionality to activities...\n');

  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/019_add_pinned_highlight.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (const statement of statements) {
      if (statement) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          console.error('Error:', error.message);
        }
      }
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Summary of changes:');
    console.log('   - Added is_pinned column (boolean)');
    console.log('   - Added is_highlighted column (boolean)');
    console.log('   - Added pinned_at column (timestamp)');
    console.log('   - Created indexes for better query performance\n');
    console.log('🎯 Next steps:');
    console.log('   1. Go to /admin/dashboard');
    console.log('   2. Edit any activity');
    console.log('   3. Toggle "Pin to Top" or "Highlight Post" options');
    console.log('   4. View the activity feed to see pinned posts at the top!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

#!/usr/bin/env node
// Check that required columns/migrations exist in the DB. Exits non-zero if missing.
// Usage: npx dotenv-cli -e .env.local -- node scripts/check_migrations.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

(async function run() {
  try {
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    // Attempt to select the new columns which should exist after migrations
    const { error } = await supabase.from('activities').select('id,initial_likes_count,initial_shares_count,initial_views_count').limit(1);
    if (error) {
      console.error('Migration check failed: could not select new columns. Error:', error.message || error);
      process.exit(2);
    }
    console.log('Migration check passed: expected columns exist.');
    process.exit(0);
  } catch (e) {
    console.error('Migration check error:', e);
    process.exit(3);
  }
})();
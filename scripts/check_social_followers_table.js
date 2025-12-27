#!/usr/bin/env node
// Check that `social_followers` table exists and print last 5 rows
// Usage: npx dotenv-cli -e .env.local -- node scripts/check_social_followers_table.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

(async function run(){
  try {
    const { data, error } = await supabase.from('social_followers').select('*').order('fetched_at', { ascending: false }).limit(5);
    if (error) {
      console.error('Error querying social_followers:', error.message || error);
      process.exit(1);
    }
    if (!data || data.length === 0) {
      console.log('Table exists but has no rows yet.');
      process.exit(0);
    }
    console.log('Recent social_followers rows:');
    console.table(data.map(r => ({ id: r.id, platform: r.platform, handle: r.handle, followers_count: r.followers_count, fetched_at: r.fetched_at })));
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
})();

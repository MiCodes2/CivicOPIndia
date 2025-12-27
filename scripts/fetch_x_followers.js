#!/usr/bin/env node
// Fetch X (Twitter) follower count and store into `social_followers` table.
// Usage: npx dotenv-cli -e .env.local -- node scripts/fetch_x_followers.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const xBearer = process.env.X_BEARER_TOKEN;
const handle = process.env.NEXT_PUBLIC_X_HANDLE || process.env.X_HANDLE || 'CivicOp_india';

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}
if (!xBearer) {
  console.error('Missing X_BEARER_TOKEN in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function fetchFollowers() {
  try {
    console.log(`Fetching X followers for @${handle}...`);
    const url = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=public_metrics`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${xBearer}` } });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => null);
      throw new Error(`X API error ${resp.status}: ${txt}`);
    }
    const data = await resp.json();
    const user = data?.data;
    if (!user || !user.public_metrics) throw new Error('Missing public_metrics in X response');
    const followers = Number(user.public_metrics.followers_count || 0);

    const { data: inserted, error } = await supabase.from('social_followers').insert([{ platform: 'x', handle, followers_count: followers }]).select('*').single();
    if (error) throw error;
    console.log('Inserted follower record:', inserted);
    return inserted;
  } catch (e) {
    console.error('Failed to fetch/insert followers:', e);
    throw e;
  }
}

(async function run(){
  try {
    await fetchFollowers();
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
})();

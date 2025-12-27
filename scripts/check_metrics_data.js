#!/usr/bin/env node
// Diagnostics script: prints time-series and sample rows for activity_views, activity_likes, activity_shares
// Usage: npx dotenv-cli -e .env.local -- node scripts/check_metrics_data.js [--days=30]

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const daysArg = process.argv.find(a => a.startsWith('--days='));
const days = daysArg ? Math.max(1, Number(daysArg.split('=')[1] || 30)) : 30;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

function toDayIso(d) {
  return new Date(d).toISOString().slice(0,10);
}

(async function run(){
  try {
    console.log(`Checking metrics for last ${days} days...`);
    const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
    const sinceIso = since.toISOString();

    const queries = [
      { name: 'views', table: 'activity_views', select: 'id, activity_id, user_id, visitor_id, created_at' },
      { name: 'likes', table: 'activity_likes', select: 'id, activity_id, ip_address, user_agent, created_at' },
      { name: 'shares', table: 'activity_shares', select: 'id, activity_id, user_id, visitor_id, created_at' },
    ];

    for (const q of queries) {
      try {
        const { data, error } = await supabase.from(q.table).select(q.select).gte('created_at', sinceIso).order('created_at', { ascending: true }).limit(2000);
        if (error) {
          console.log(`Table ${q.table}: error =>`, error.message || error);
          continue;
        }
        if (!data || data.length === 0) {
          console.log(`Table ${q.table}: NO ROWS in last ${days} days`);
          continue;
        }
        // aggregate counts by day
        const counts = {};
        for (const r of data) {
          const d = toDayIso(r.created_at);
          counts[d] = (counts[d] || 0) + 1;
        }
        const keys = Object.keys(counts).sort();
        console.log(`\nTable ${q.table}: total rows fetched: ${data.length}`);
        console.log('Sample rows (first 5):');
        console.table(data.slice(0,5));
        console.log('Daily counts:');
        console.table(keys.map(k => ({ day: k, count: counts[k] })));
      } catch (e) {
        console.error(`Failed to query ${q.table}:`, e?.message || e);
      }
    }

    // Also show aggregate totals from activities table
    try {
      const { data: acts, error: aErr } = await supabase.from('activities').select('id,title,created_at,likes_count,shares_count,views_count').order('created_at',{ ascending:false }).limit(10);
      if (aErr) {
        console.error('Failed to fetch activities:', aErr.message || aErr);
      } else {
        console.log('\nRecent activities (latest 10):');
        console.table(acts || []);
      }
    } catch (e) {
      console.error('Error fetching activities:', e?.message || e);
    }

    console.log('\nDone.');
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error:', e?.message || e);
    process.exit(1);
  }
})();

#!/usr/bin/env node
// Run anomaly detector and fix problematic metrics automatically (requires service role key)
// Usage: npx dotenv-cli -e .env.local -- node scripts/fix_metrics_and_report.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

(async function run(){
  try {
    const { data: activities } = await supabase.from('activities').select('id,title,likes_count,shares_count,views_count').order('id');
    if (!activities) { console.log('No activities'); process.exit(0); }

    const fixes = [];
    for (const a of activities) {
      const likes = a.likes_count || 0;
      const shares = a.shares_count || 0;
      const views = a.views_count || 0;

      let newShares = shares;
      let newViews = views;
      let changed = false;

      const maxByPct = Math.ceil(likes * 0.15);
      const capShares = Math.min(likes, maxByPct || likes);
      if (shares > capShares) {
        newShares = capShares;
        changed = true;
      }

      if (likes > views) {
        newViews = likes;
        changed = true;
      }

      if (changed) {
        const updates = {};
        if (newShares !== shares) updates.shares_count = newShares;
        if (newViews !== views) updates.views_count = newViews;
        const { error } = await supabase.from('activities').update(updates).eq('id', a.id);
        if (error) {
          console.error('Failed to update activity', a.id, error);
        } else {
          fixes.push({ id: a.id, title: a.title, old: { likes, shares, views }, updates });
        }
      }
    }

    console.log('Fixed', fixes.length, 'activities');
    console.table(fixes.slice(0, 200));
    process.exit(0);
  } catch (e) {
    console.error('Error', e);
    process.exit(1);
  }
})();
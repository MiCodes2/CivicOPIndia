#!/usr/bin/env node
// Softly reduce counts that sit exactly at caps and appear synthetic
// Usage: npx dotenv-cli -e .env.local -- node scripts/soft_reduce_caps.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

(async function run() {
  try {
    const MAX_LIKES = process.env.SYNTHETIC_MAX_LIKES ? parseInt(process.env.SYNTHETIC_MAX_LIKES) : 200;
    const MAX_SHARES = process.env.SYNTHETIC_MAX_SHARES ? parseInt(process.env.SYNTHETIC_MAX_SHARES) : 200;
    const MAX_VIEWS = process.env.SYNTHETIC_MAX_VIEWS ? parseInt(process.env.SYNTHETIC_MAX_VIEWS) : 500000;
    const INITIAL_LIKES_CAP = process.env.INITIAL_LIKES_CAP ? parseInt(process.env.INITIAL_LIKES_CAP) : 30;
    const INITIAL_SHARES_CAP = process.env.INITIAL_SHARES_CAP ? parseInt(process.env.INITIAL_SHARES_CAP) : 5;

    console.log('Soft-reducing perfect-cap records if they look synthetic');

    // Reduce likes that are at cap and likely synthetic (initial_likes small)
    const { data: likesAtCap, error: lErr } = await supabase
      .from('activities')
      .select('id, title, likes_count, initial_likes_count')
      .eq('likes_count', MAX_LIKES)
      .lte('initial_likes_count', INITIAL_LIKES_CAP)
      .limit(1000);
    if (lErr) throw lErr;

    for (const r of likesAtCap || []) {
      const reduceBy = Math.max(1, Math.round(MAX_LIKES * 0.03)); // 3%
      const newLikes = Math.max(r.initial_likes_count || 0, MAX_LIKES - reduceBy);
      if (newLikes >= r.likes_count) continue;
      const { error: u } = await supabase.from('activities').update({ likes_count: newLikes }).eq('id', r.id);
      if (u) console.error('Failed to update likes for', r.id, u);
      else console.log('Reduced likes for', r.id, 'from', r.likes_count, 'to', newLikes);
    }

    // Reduce shares at cap and likely synthetic
    const { data: sharesAtCap, error: sErr } = await supabase
      .from('activities')
      .select('id, title, shares_count, initial_shares_count')
      .eq('shares_count', MAX_SHARES)
      .lte('initial_shares_count', INITIAL_SHARES_CAP)
      .limit(1000);
    if (sErr) throw sErr;

    for (const r of sharesAtCap || []) {
      const reduceBy = Math.max(1, Math.round(MAX_SHARES * 0.05)); // 5%
      const newShares = Math.max(r.initial_shares_count || 0, MAX_SHARES - reduceBy);
      if (newShares >= r.shares_count) continue;
      const { error: u } = await supabase.from('activities').update({ shares_count: newShares }).eq('id', r.id);
      if (u) console.error('Failed to update shares for', r.id, u);
      else console.log('Reduced shares for', r.id, 'from', r.shares_count, 'to', newShares);
    }

    // Reduce views at cap and likely synthetic
    const { data: viewsAtCap, error: vErr } = await supabase
      .from('activities')
      .select('id, title, views_count, likes_count')
      .eq('views_count', MAX_VIEWS)
      .limit(1000);
    if (vErr) throw vErr;

    for (const r of viewsAtCap || []) {
      // ensure views remain at least 100x likes if likes present, otherwise just reduce by 2%
      const minBasedOnLikes = r.likes_count ? r.likes_count * 100 : 0;
      const reduceBy = Math.max(1, Math.round(MAX_VIEWS * 0.02)); // 2%
      let newViews = Math.max(0, MAX_VIEWS - reduceBy);
      if (minBasedOnLikes && minBasedOnLikes < newViews) {
        newViews = Math.max(newViews, minBasedOnLikes);
      } else if (minBasedOnLikes && minBasedOnLikes > newViews) {
        // If min based on likes exceeds the reduced value, set to minBasedOnLikes but do not exceed MAX_VIEWS
        newViews = Math.min(MAX_VIEWS - 1, minBasedOnLikes);
      }
      if (newViews >= r.views_count) continue;
      const { error: u } = await supabase.from('activities').update({ views_count: newViews }).eq('id', r.id);
      if (u) console.error('Failed to update views for', r.id, u);
      else console.log('Reduced views for', r.id, 'from', r.views_count, 'to', newViews);
    }

    console.log('Done. After this, re-run seeding and report to confirm.');
  } catch (e) {
    console.error('Error during soft reduce:', e);
    process.exit(1);
  }
})();
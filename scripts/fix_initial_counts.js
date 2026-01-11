#!/usr/bin/env node
// Fix initial_likes_count/initial_shares_count and clamp existing likes/shares to safe caps
// Usage: npx dotenv-cli -e .env.local -- node scripts/fix_initial_counts.js

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

    // By default we DO NOT clamp current (real) counts because real interactions must always be preserved.
    // Instead, report how many rows exceed the synthetic caps so the operator can decide on manual action.
    const args = process.argv.slice(2);
    const FORCE = args.includes('--force');

    const { data: overLikes } = await supabase.from('activities').select('id,likes_count').gt('likes_count', MAX_LIKES).limit(1000);
    console.log('Activities with likes_count >', MAX_LIKES, ':', (overLikes || []).length);
    if ((overLikes || []).length > 0 && FORCE) {
      console.log('FORCE flag set — clamping likes to', MAX_LIKES);
      const { data: changedLikes, error: e1 } = await supabase.from('activities').update({ likes_count: MAX_LIKES }).gt('likes_count', MAX_LIKES).select('id,likes_count').limit(1000);
      if (e1) throw e1;
      console.log('Clamped likes for', changedLikes?.length || 0, 'activities');
    }

    const { data: overShares } = await supabase.from('activities').select('id,shares_count').gt('shares_count', MAX_SHARES).limit(1000);
    console.log('Activities with shares_count >', MAX_SHARES, ':', (overShares || []).length);
    if ((overShares || []).length > 0 && FORCE) {
      console.log('FORCE flag set — clamping shares to', MAX_SHARES);
      const { data: changedShares, error: e2 } = await supabase.from('activities').update({ shares_count: MAX_SHARES }).gt('shares_count', MAX_SHARES).select('id,shares_count').limit(1000);
      if (e2) throw e2;
      console.log('Clamped shares for', changedShares?.length || 0, 'activities');
    }

    // Views
    const { data: overViews } = await supabase.from('activities').select('id,views_count').gt('views_count', MAX_VIEWS).limit(1000);
    console.log('Activities with views_count >', MAX_VIEWS, ':', (overViews || []).length);
    if ((overViews || []).length > 0 && FORCE) {
      console.log('FORCE flag set — clamping views to', MAX_VIEWS);
      const { data: changedViews, error: eViews } = await supabase.from('activities').update({ views_count: MAX_VIEWS }).gt('views_count', MAX_VIEWS).select('id,views_count').limit(1000);
      if (eViews) throw eViews;
      console.log('Clamped views for', changedViews?.length || 0, 'activities');
    }

    console.log('Clamping initial_likes_count >', INITIAL_LIKES_CAP, 'to', INITIAL_LIKES_CAP);
    const { data: changedInitLikes, error: e3 } = await supabase.from('activities').update({ initial_likes_count: INITIAL_LIKES_CAP }).gt('initial_likes_count', INITIAL_LIKES_CAP).select('id,initial_likes_count').limit(1000);
    if (e3) throw e3;
    console.log('Clamped initial likes for', changedInitLikes?.length || 0, 'activities');

    console.log('Clamping initial_shares_count >', INITIAL_SHARES_CAP, 'to', INITIAL_SHARES_CAP);
    const { data: changedInitShares, error: e4 } = await supabase.from('activities').update({ initial_shares_count: INITIAL_SHARES_CAP }).gt('initial_shares_count', INITIAL_SHARES_CAP).select('id,initial_shares_count').limit(1000);
    if (e4) throw e4;
    console.log('Clamped initial shares for', changedInitShares?.length || 0, 'activities');

    // Clamp initial views relative to initial likes * 150 if present
    const INITIAL_VIEWS_CAP = process.env.INITIAL_VIEWS_CAP ? parseInt(process.env.INITIAL_VIEWS_CAP) : (INITIAL_LIKES_CAP * 150);
    console.log('Clamping initial_views_count >', INITIAL_VIEWS_CAP, 'to', INITIAL_VIEWS_CAP);
    const { data: changedInitViews, error: e5 } = await supabase.from('activities').update({ initial_views_count: INITIAL_VIEWS_CAP }).gt('initial_views_count', INITIAL_VIEWS_CAP).select('id,initial_views_count').limit(1000);
    if (e5) throw e5;
    console.log('Clamped initial views for', changedInitViews?.length || 0, 'activities');

    console.log('Done. Now re-running seeding to enforce caps.');
  } catch (e) {
    console.error('Error fixing counts:', e);
    process.exit(1);
  }
})();

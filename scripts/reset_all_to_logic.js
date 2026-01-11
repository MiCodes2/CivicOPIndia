#!/usr/bin/env node
// Reset all activities to deterministic seeded initial values and set current counts
// according to the 3-day -> 30-day growth model. Safe by default (dry-run);
// use `--apply` to perform updates and `--force` to allow decreasing existing counts.
// Usage (dry run): npx dotenv-cli -e .env.local -- node scripts/reset_all_to_logic.js
// Apply changes: npx dotenv-cli -e .env.local -- node scripts/reset_all_to_logic.js --apply
// Force decreases: npx dotenv-cli -e .env.local -- node scripts/reset_all_to_logic.js --apply --force

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const FORCE = argv.includes('--force');

const MIN_MUL = process.env.SYNTHETIC_INITIAL_MULTIPLIER_MIN ? parseInt(process.env.SYNTHETIC_INITIAL_MULTIPLIER_MIN) : 3;
const MAX_MUL = process.env.SYNTHETIC_INITIAL_MULTIPLIER_MAX ? parseInt(process.env.SYNTHETIC_INITIAL_MULTIPLIER_MAX) : 5;
const MAX_LIKES = process.env.SYNTHETIC_MAX_LIKES ? parseInt(process.env.SYNTHETIC_MAX_LIKES) : 200;
const MAX_SHARES = process.env.SYNTHETIC_MAX_SHARES ? parseInt(process.env.SYNTHETIC_MAX_SHARES) : 200;
const MAX_VIEWS = process.env.SYNTHETIC_MAX_VIEWS ? parseInt(process.env.SYNTHETIC_MAX_VIEWS) : 500000;
const INITIAL_LIKES_CAP = process.env.INITIAL_LIKES_CAP ? parseInt(process.env.INITIAL_LIKES_CAP) : 30;
const INITIAL_SHARES_CAP = process.env.INITIAL_SHARES_CAP ? parseInt(process.env.INITIAL_SHARES_CAP) : 5;
const INITIAL_VIEWS_CAP = process.env.INITIAL_VIEWS_CAP ? parseInt(process.env.INITIAL_VIEWS_CAP) : (INITIAL_LIKES_CAP * 150);

function seededRandom(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  return function() {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function growthFractionToReach(createdAt, reachDays) {
  const created = new Date(createdAt); const now = new Date();
  const days = Math.max(0, (now.getTime() - created.getTime())/(1000*60*60*24));
  if (days <= 0) return 0; if (days >= reachDays) return 1;
  const a = 1.0; const num = 1 - Math.exp(-a * days); const den = 1 - Math.exp(-a * reachDays);
  return Math.max(0, Math.min(1, num/den));
}

(async function run() {
  try {
    console.log('Reset all activities to seeded logic (apply=%s force=%s) -- MIN_MUL=%s MAX_MUL=%s', APPLY, FORCE, MIN_MUL, MAX_MUL);

    const { data: activities, error } = await supabase.from('activities').select('id,created_at,activity_date,likes_count,shares_count,views_count,initial_likes_count,initial_shares_count,initial_views_count').order('created_at', { ascending: true });
    if (error) throw error;
    console.log('Found', activities.length, 'activities');

    let updates = 0;
    let reductions = 0;

    for (const act of activities) {
      const seedStr = `${act.id}-${act.created_at || ''}`;
      const rand = seededRandom(seedStr);

      const baseLike = 1 + Math.floor(rand() * 10); // 1..10
      const baseShare = Math.floor(rand() * 4); // 0..3
      const mul = MIN_MUL + Math.floor(rand() * (MAX_MUL - MIN_MUL + 1));

      let newInitLikes = Math.min(MAX_LIKES, Math.round(baseLike * mul));
      let newInitShares = Math.min(MAX_SHARES, Math.round(baseShare * mul));

      // Apply initial caps
      newInitLikes = Math.min(newInitLikes, INITIAL_LIKES_CAP);
      newInitShares = Math.min(newInitShares, INITIAL_SHARES_CAP);

      // If existing initial values are present, respect them unless we are forcing overwrite
      if (!FORCE) {
        if (act.initial_likes_count && act.initial_likes_count > 0) newInitLikes = act.initial_likes_count;
        if (act.initial_shares_count && act.initial_shares_count > 0) newInitShares = act.initial_shares_count;
      }

      // Derive initial views from initial likes if not present
      const viewMultiplier = 100 + Math.floor(rand() * 51); // 100..150
      let newInitViews = Math.min(MAX_VIEWS, Math.round(newInitLikes * viewMultiplier));
      newInitViews = Math.min(newInitViews, INITIAL_VIEWS_CAP);
      if (!FORCE) {
        if (act.initial_views_count && act.initial_views_count > 0) newInitViews = act.initial_views_count;
      }

      // Compute targets (similar to computeSyntheticTargets)
      // Likes target: small percent of views
      const likePct = 0.005 + rand() * 0.015;
      const likesTargetRaw = Math.max(1, Math.round(newInitViews * likePct));
      const likesTarget = Math.min(MAX_LIKES, likesTargetRaw);

      // Shares target derived from likes
      const baseSharePct = 100 / 1500; // ~0.0667
      const sharePct = baseSharePct * (0.9 + rand() * 0.2);
      const sharesTarget = Math.min(MAX_SHARES, Math.round(likesTarget * sharePct));

      // Views target derived from likesTarget
      const viewMultiplierFinal = 100 + Math.floor(rand() * 51);
      const viewsTarget = Math.min(MAX_VIEWS, Math.round(likesTarget * viewMultiplierFinal));

      // Compute synthetic "now" values per displayedMetricWithInitial logic: reach initial in 3 days, final in 30 days
      const createdAt = act.created_at || act.activity_date || new Date().toISOString();
      const fracBase = growthFractionToReach(createdAt, 3);
      const fracFinal = growthFractionToReach(createdAt, 30);

      const syntheticViewsNow = newInitViews > 0 ? Math.min(viewsTarget, Math.round(newInitViews * fracBase) + Math.round(Math.max(0, viewsTarget - newInitViews) * fracFinal)) : Math.round(viewsTarget * fracFinal);
      const syntheticLikesNow = newInitLikes > 0 ? Math.min(likesTarget, Math.round(newInitLikes * fracBase) + Math.round(Math.max(0, likesTarget - newInitLikes) * fracFinal)) : Math.min(likesTarget, Math.round(likesTarget * fracFinal));
      const syntheticSharesNow = newInitShares > 0 ? Math.min(sharesTarget, Math.round(newInitShares * fracBase) + Math.round(Math.max(0, sharesTarget - newInitShares) * fracFinal)) : Math.min(sharesTarget, Math.round(sharesTarget * fracFinal));

      // Apply non-decreasing safety by default
      const curViews = act.views_count || 0;
      const curLikes = act.likes_count || 0;
      const curShares = act.shares_count || 0;

      const targetViewsToSet = APPLY ? (FORCE ? syntheticViewsNow : Math.max(curViews, syntheticViewsNow)) : syntheticViewsNow;
      const targetLikesToSet = APPLY ? (FORCE ? syntheticLikesNow : Math.max(curLikes, syntheticLikesNow)) : syntheticLikesNow;
      const targetSharesToSet = APPLY ? (FORCE ? syntheticSharesNow : Math.max(curShares, syntheticSharesNow)) : syntheticSharesNow;

      const willReduce = (targetViewsToSet < curViews) || (targetLikesToSet < curLikes) || (targetSharesToSet < curShares);
      if (willReduce && !FORCE && APPLY) {
        // Skip reducing in non-force apply mode
      }

      const toUpdate = {};
      if (act.initial_likes_count !== newInitLikes) toUpdate.initial_likes_count = newInitLikes;
      if (act.initial_shares_count !== newInitShares) toUpdate.initial_shares_count = newInitShares;
      if (act.initial_views_count !== newInitViews) toUpdate.initial_views_count = newInitViews;

      if (APPLY) {
        if (FORCE || targetViewsToSet >= curViews) toUpdate.views_count = targetViewsToSet;
        if (FORCE || targetLikesToSet >= curLikes) toUpdate.likes_count = targetLikesToSet;
        if (FORCE || targetSharesToSet >= curShares) toUpdate.shares_count = targetSharesToSet;
      } else {
        // Dry-run: show computed values but don't set
        toUpdate._computed = { views: syntheticViewsNow, likes: syntheticLikesNow, shares: syntheticSharesNow };
      }

      // Skip if nothing to change
      if (Object.keys(toUpdate).length === 0) continue;

      // Count reductions for reporting
      if (APPLY && !FORCE) {
        if ((toUpdate.views_count != null) && toUpdate.views_count < curViews) reductions++;
        if ((toUpdate.likes_count != null) && toUpdate.likes_count < curLikes) reductions++;
        if ((toUpdate.shares_count != null) && toUpdate.shares_count < curShares) reductions++;
      }

      if (APPLY) {
        const { error: uerr } = await supabase.from('activities').update(toUpdate).eq('id', act.id);
        if (uerr) {
          console.error('Failed update', act.id, uerr);
        } else {
          updates++;
          if (updates % 50 === 0) console.log('Updated', updates, 'rows...');
        }
      } else {
        console.log('DRY:', act.id, 'computed:', toUpdate);
      }
    }

    console.log('Done. Updated (applied):', updates, 'reductions(skipped unless --force):', reductions);
    if (!APPLY) console.log('Dry-run complete. Rerun with --apply to perform updates. Add --force to allow decreasing existing counts.');
    process.exit(0);
  } catch (e) {
    console.error('Error resetting:', e);
    process.exit(1);
  }
})();

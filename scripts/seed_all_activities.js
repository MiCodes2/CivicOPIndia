#!/usr/bin/env node
// Seed all activities with synthetic progress server-side (idempotent)
// Usage locally: npx dotenv-cli -e .env.local -- node scripts/seed_all_activities.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

function seededRandom(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  return function() {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function computeSyntheticTargets(activity) {
  const observedLikes = activity.likes_count || 0;
  const observedShares = activity.shares_count || 0;
  const initialLikes = (activity.initial_likes_count != null) ? activity.initial_likes_count : observedLikes;
  const initialShares = (activity.initial_shares_count != null) ? activity.initial_shares_count : observedShares;

  const seedStr = `${activity.id}-${activity.created_at || ''}`;
  const rand = seededRandom(seedStr);

  // Views target: between 100x and 500x of a small assigned base
  const multiplier = Math.round(100 + Math.floor(rand() * 401)); // 100..500
  const assignedBaseLikes = Math.max(1, Math.round(1 + Math.floor(rand() * 3)));
  let viewsTarget = Math.max(1, Math.round(assignedBaseLikes * multiplier));

  // Apply global views cap (default 500k)
  const envMaxViews = process.env.SYNTHETIC_MAX_VIEWS ? parseInt(process.env.SYNTHETIC_MAX_VIEWS) : NaN;
  const MAX_VIEWS = Number.isFinite(envMaxViews) && envMaxViews > 0 ? envMaxViews : 500000;
  viewsTarget = Math.min(viewsTarget, MAX_VIEWS);

  // Likes target is a small pct of views (0.5% - 2.0%) but capped relative to initial likes
  const likePct = 0.005 + rand() * 0.015;
  const likesTargetRaw = Math.max(1, Math.round(viewsTarget * likePct));

  const envMul = process.env.SYNTHETIC_MAX_MULTIPLIER ? parseInt(process.env.SYNTHETIC_MAX_MULTIPLIER) : NaN;
  const MAX_MULTIPLIER = Number.isFinite(envMul) && envMul > 0 ? envMul : 5;

  const likesCapFromInitial = Math.max(initialLikes, Math.round(initialLikes * MAX_MULTIPLIER));
  const likesCapFallback = Math.max(assignedBaseLikes, Math.round(assignedBaseLikes * 1.25));
  const likesCap = initialLikes > 0 ? likesCapFromInitial : likesCapFallback;

  const envMaxLikes = process.env.SYNTHETIC_MAX_LIKES ? parseInt(process.env.SYNTHETIC_MAX_LIKES) : NaN;
  const MAX_LIKES = Number.isFinite(envMaxLikes) && envMaxLikes > 0 ? envMaxLikes : 200;

  let likesTarget = Math.min(likesTargetRaw, likesCap, MAX_LIKES);
  if (observedLikes > likesTarget) likesTarget = observedLikes;

  // Shares target: baseline ~100/1500 ≈ 6.67% with ±10% variation, capped by initial/share caps
  const baseSharePct = 100 / 1500; // ~0.0666667
  const sharePct = baseSharePct * (0.9 + rand() * 0.2); // ±10%
  let sharesTarget = Math.max(observedShares, Math.max(0, Math.round(likesTarget * sharePct)));

  const sharesCapFromInitial = initialShares > 0 ? Math.max(initialShares, Math.round(initialShares * MAX_MULTIPLIER)) : Infinity;
  const envMaxShares = process.env.SYNTHETIC_MAX_SHARES ? parseInt(process.env.SYNTHETIC_MAX_SHARES) : NaN;
  const MAX_SHARES = Number.isFinite(envMaxShares) && envMaxShares > 0 ? envMaxShares : 200;

  sharesTarget = Math.min(sharesTarget, sharesCapFromInitial, MAX_SHARES, likesTarget);
  if (observedShares > sharesTarget) sharesTarget = observedShares;

  return { viewsTarget, likesTarget, sharesTarget };
}

function growthFractionSince(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const days = diffMs / (1000 * 60 * 60 * 24);
  if (days <= 0) return 0;
  if (days >= 7) return 1;
  const a = 0.5;
  const num = 1 - Math.exp(-a * days);
  const den = 1 - Math.exp(-a * 7);
  return Math.max(0, Math.min(1, num / den));
}

function growthFractionToReach(createdAt, reachDays) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const days = diffMs / (1000 * 60 * 60 * 24);
  if (days <= 0) return 0;
  if (days >= reachDays) return 1;
  const a = 1.0;
  const num = 1 - Math.exp(-a * days);
  const den = 1 - Math.exp(-a * reachDays);
  return Math.max(0, Math.min(1, num / den));
}

(async function run() {
  try {
    console.log('Fetching activities...');
    const { data: activities, error } = await supabase.from('activities').select('id,created_at,likes_count,shares_count,views_count').order('created_at', { ascending: true });
    if (error) throw error;
    console.log(`Found ${activities.length} activities`);

    let updatedCount = 0;
    for (const act of activities) {
      const { viewsTarget, likesTarget, sharesTarget } = computeSyntheticTargets(act);
      // If activity has an assigned initial likes value, ensure that initial is reached by day 3 and extra synthetic is added over time.
      const frac = growthFractionSince(act.created_at || new Date().toISOString());

      // compute views synthetic; if activity has initial_views_count, reach that in ~3 days
      const initialViews = act.initial_views_count || Math.round((act.initial_likes_count || 0) * 100);
      let syntheticViews;
      if (initialViews > 0) {
        const baseFracV = growthFractionToReach(act.created_at || new Date().toISOString(), 3);
        const extraFracV = frac;
        const basePartV = Math.round(initialViews * baseFracV);
        const extraPartV = Math.round(Math.max(0, viewsTarget - initialViews) * extraFracV);
        syntheticViews = Math.min(viewsTarget, basePartV + extraPartV);
      } else {
        syntheticViews = Math.round(viewsTarget * frac);
      }

      // likes: if activity has initial_likes_count, reach that in ~3 days and add extra later
      const initialLikes = act.initial_likes_count || 0;
      let syntheticLikes;
      if (initialLikes > 0) {
        const baseFrac = growthFractionToReach(act.created_at || new Date().toISOString(), 3);
        const extraFrac = frac; // same 7-day curve for extra
        const basePart = Math.round(initialLikes * baseFrac);
        const extraPart = Math.round(Math.max(0, likesTarget - initialLikes) * extraFrac);
        syntheticLikes = Math.min(likesTarget, basePart + extraPart);
      } else {
        syntheticLikes = Math.min(likesTarget, Math.round(likesTarget * frac));
      }

      // shares: similarly respect initial shares if present
      const initialShares = act.initial_shares_count || 0;
      let syntheticShares;
      if (initialShares > 0) {
        const baseFracS = growthFractionToReach(act.created_at || new Date().toISOString(), 3);
        const extraFracS = frac;
        const basePartS = Math.round(initialShares * baseFracS);
        const extraPartS = Math.round(Math.max(0, sharesTarget - initialShares) * extraFracS);
        syntheticShares = Math.min(sharesTarget, basePartS + extraPartS);
      } else {
        syntheticShares = Math.min(sharesTarget, Math.round(sharesTarget * frac));
      }

      const updates = {};
      if ((act.views_count || 0) < syntheticViews) updates.views_count = syntheticViews;

      const incrementalIncrease = (current, target) => {
        const gap = Math.max(0, target - current);
        if (gap <= 0) return 0;
        return Math.max(1, Math.round(gap * 0.25));
      };

      const curLikes = act.likes_count || 0;
      if (curLikes < syntheticLikes) {
        const delta = incrementalIncrease(curLikes, syntheticLikes);
        updates.likes_count = Math.min(syntheticLikes, curLikes + delta);
      }

      const curShares = act.shares_count || 0;
      if (curShares < syntheticShares) {
        const delta = incrementalIncrease(curShares, syntheticShares);
        updates.shares_count = Math.min(syntheticShares, curShares + delta);
      }

      // Ensure shares don't exceed likes after update
      if (updates.shares_count != null) {
        const futureLikes = updates.likes_count ?? act.likes_count ?? 0;
        if (updates.shares_count > futureLikes) updates.shares_count = futureLikes;
      }

      if (Object.keys(updates).length > 0) {
        const { data: u, error: uerr } = await supabase.from('activities').update(updates).eq('id', act.id).select('id,views_count,likes_count,shares_count').maybeSingle();
        if (uerr) {
          console.error('Failed to update activity', act.id, uerr);
        } else {
          updatedCount++;
          console.log('Updated', act.id, updates);
        }
      }
    }

    console.log('Done. Updated', updatedCount, 'activities.');
    process.exit(0);
  } catch (e) {
    console.error('Error during seeding:', e);
    process.exit(1);
  }
})();

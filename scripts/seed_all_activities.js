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
  const likes = activity.likes_count || 0;
  const shares = activity.shares_count || 0;
  const seedStr = `${activity.id}-${activity.created_at || ''}`;
  const rand = seededRandom(seedStr);

  const multiplier = Math.round(100 + Math.floor(rand() * 401)); // 100..500
  const baseLikes = Math.max(1, likes || Math.round(1 + Math.floor(rand() * 3)));
  const viewsTarget = Math.max(1, Math.round(baseLikes * multiplier));

  const likePct = 0.005 + rand() * 0.015;
  const likesTargetRaw = Math.max(likes, Math.max(1, Math.round(viewsTarget * likePct)));
  const likesCap = Math.max(likes, Math.round(baseLikes * 1.25));
  const likesTarget = Math.min(likesTargetRaw, likesCap);

  // Shares derived from likesTarget (10% - 15%), and never more than likesTarget
  const sharePct = 0.10 + rand() * 0.05; // 10%..15%
  let sharesTarget = Math.max(shares, Math.max(0, Math.round(likesTarget * sharePct)));
  sharesTarget = Math.min(sharesTarget, likesTarget);

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

(async function run() {
  try {
    console.log('Fetching activities...');
    const { data: activities, error } = await supabase.from('activities').select('id,created_at,likes_count,shares_count,views_count').order('created_at', { ascending: true });
    if (error) throw error;
    console.log(`Found ${activities.length} activities`);

    let updatedCount = 0;
    for (const act of activities) {
      const { viewsTarget, likesTarget, sharesTarget } = computeSyntheticTargets(act);
      const frac = growthFractionSince(act.created_at || new Date().toISOString());
      const syntheticViews = Math.round(viewsTarget * frac);
      const syntheticLikes = Math.min(likesTarget, Math.round(likesTarget * frac));
      const syntheticShares = Math.min(sharesTarget, Math.round(sharesTarget * frac));

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

#!/usr/bin/env node
// Verify growth logic for a sample of activities (non-destructive)
// Usage: npx dotenv-cli -e .env.local -- node scripts/verify_growth_logic.js [--sample=N]

// Using dynamic imports to avoid top-level CommonJS `require()` and satisfy lint rules
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function seededRandom(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  return function() { h += 0x6D2B79F5; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function growthFractionToReach(createdAt, reachDays) {
  const created = new Date(createdAt); const now = new Date();
  const days = Math.max(0, (now.getTime() - created.getTime())/(1000*60*60*24));
  if (days <= 0) return 0; if (days >= reachDays) return 1; const a = 1.0; const num = 1 - Math.exp(-a * days); const den = 1 - Math.exp(-a * reachDays); return Math.max(0, Math.min(1, num/den));
}

(async () => {
  try {
    const args = process.argv.slice(2);
    const sampleArg = args.find(a => a.startsWith('--sample='));
    const sample = sampleArg ? parseInt(sampleArg.split('=')[1], 10) : 10;

    console.log('Fetching', sample, 'activities to verify (non-destructive)');
    const { data: acts, error } = await supabase.from('activities').select('id,created_at,activity_date,likes_count,shares_count,views_count,initial_likes_count,initial_shares_count,initial_views_count,title').order('created_at', { ascending: false }).limit(sample);
    if (error) throw error;

    let pass = 0, fail = 0;
    for (const act of acts) {
      const seedStr = `${act.id}-${act.created_at || ''}`;
      const rand = seededRandom(seedStr);
      // derive initial views if not set
      const initialViews = act.initial_views_count || Math.round((act.initial_likes_count || 0) * 100);
      const initialLikes = act.initial_likes_count || 0;
      const initialShares = act.initial_shares_count || 0;

      // compute targets similar to computeSyntheticTargets
      const multiplier = Math.round(100 + Math.floor(rand() * 401));
      const assignedBaseLikes = Math.max(1, Math.round(1 + Math.floor(rand() * 3)));
      let viewsTarget = Math.max(1, Math.round(assignedBaseLikes * multiplier));
      const MAX_VIEWS = Number.isFinite(Number(process.env.SYNTHETIC_MAX_VIEWS)) && Number(process.env.SYNTHETIC_MAX_VIEWS) > 0 ? Number(process.env.SYNTHETIC_MAX_VIEWS) : 500000;
      viewsTarget = Math.min(viewsTarget, MAX_VIEWS);
      const likePct = 0.005 + rand() * 0.015;
      const likesTargetRaw = Math.max(1, Math.round(viewsTarget * likePct));
      const MAX_LIKES = Number.isFinite(Number(process.env.SYNTHETIC_MAX_LIKES)) && Number(process.env.SYNTHETIC_MAX_LIKES) > 0 ? Number(process.env.SYNTHETIC_MAX_LIKES) : 200;
      let likesTarget = Math.min(likesTargetRaw, MAX_LIKES);
      const baseSharePct = 100 / 1500; const sharePct = baseSharePct * (0.9 + rand() * 0.2);
      let sharesTarget = Math.max(0, Math.round(likesTarget * sharePct));
      const viewMultiplier = 100 + Math.floor(rand() * 51);
      viewsTarget = Math.min(MAX_VIEWS, Math.round(likesTarget * viewMultiplier));

      // Now compute "now" values per initial->3d->30d model
      const createdAt = act.created_at || act.activity_date || new Date().toISOString();
      const baseFrac = growthFractionToReach(createdAt, 3);
      const finalFrac = growthFractionToReach(createdAt, 30);

      const syntheticViewsNow = initialViews > 0 ? Math.min(viewsTarget, Math.round(initialViews * baseFrac) + Math.round(Math.max(0, viewsTarget - initialViews) * finalFrac)) : Math.round(viewsTarget * finalFrac);
      const syntheticLikesNow = initialLikes > 0 ? Math.min(likesTarget, Math.round(initialLikes * baseFrac) + Math.round(Math.max(0, likesTarget - initialLikes) * finalFrac)) : Math.min(likesTarget, Math.round(likesTarget * finalFrac));
      const syntheticSharesNow = initialShares > 0 ? Math.min(sharesTarget, Math.round(initialShares * baseFrac) + Math.round(Math.max(0, sharesTarget - initialShares) * finalFrac)) : Math.min(sharesTarget, Math.round(sharesTarget * finalFrac));

      // Compare DB counts to computed values
      const okViews = (act.views_count || 0) >= syntheticViewsNow;
      const okLikes = (act.likes_count || 0) >= syntheticLikesNow;
      const okShares = (act.shares_count || 0) >= syntheticSharesNow;

      const allOk = okViews && okLikes && okShares;
      if (allOk) pass++; else fail++;

      console.log('---');
      console.log(`${act.id} • ${act.title?.slice(0,60) || ''}`);
      console.log('DB: views=%d likes=%d shares=%d', act.views_count||0, act.likes_count||0, act.shares_count||0);
      console.log('Initials: init_views=%d init_likes=%d init_shares=%d', initialViews, initialLikes, initialShares);
      console.log('Computed now: views=%d likes=%d shares=%d', syntheticViewsNow, syntheticLikesNow, syntheticSharesNow);
      console.log('Status:', allOk ? 'PASS' : 'FAIL (DB below computed now)');
    }

    console.log('Summary: pass=%d fail=%d', pass, fail);
    if (fail > 0) process.exit(2); else process.exit(0);
  } catch (e) {
    console.error('Error verifying growth logic:', e);
    process.exit(3);
  }
})();
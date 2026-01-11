#!/usr/bin/env node
// Overwrite all activities with deterministic seeded initial likes/shares (baseline * multiplier)
// Usage: npx dotenv-cli -e .env.local -- node scripts/overwrite_with_seeds.js

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

(async function run() {
  try {
    const MIN_MUL = process.env.SYNTHETIC_INITIAL_MULTIPLIER_MIN ? parseInt(process.env.SYNTHETIC_INITIAL_MULTIPLIER_MIN) : 5;
    const MAX_MUL = process.env.SYNTHETIC_INITIAL_MULTIPLIER_MAX ? parseInt(process.env.SYNTHETIC_INITIAL_MULTIPLIER_MAX) : 10;
    const MAX_LIKES = process.env.SYNTHETIC_MAX_LIKES ? parseInt(process.env.SYNTHETIC_MAX_LIKES) : 1500;
    const MAX_SHARES = process.env.SYNTHETIC_MAX_SHARES ? parseInt(process.env.SYNTHETIC_MAX_SHARES) : 120;

    console.log('Overwrite all activities with seeded values (minMul=%s maxMul=%s maxLikes=%s maxShares=%s)', MIN_MUL, MAX_MUL, MAX_LIKES, MAX_SHARES);

    const { data: activities, error } = await supabase.from('activities').select('id,created_at,likes_count,shares_count');
    if (error) throw error;
    console.log('Found', activities.length, 'activities');

    let updated = 0;
    for (const act of activities) {
      const seedStr = `${act.id}-${act.created_at || ''}`;
      const rand = seededRandom(seedStr);
      // deterministic base
      const baseLike = 1 + Math.floor(rand() * 10); // 1..10
      const baseShare = Math.floor(rand() * 4); // 0..3
      const mul = MIN_MUL + Math.floor(rand() * (MAX_MUL - MIN_MUL + 1));

      const newLikes = Math.min(MAX_LIKES, Math.round(baseLike * mul));
      const newShares = Math.min(MAX_SHARES, Math.round(baseShare * mul));

      const updates = {
        likes_count: newLikes,
        shares_count: newShares,
        initial_likes_count: newLikes,
        initial_shares_count: newShares,
      };

      const { error: uerr } = await supabase.from('activities').update(updates).eq('id', act.id);
      if (uerr) {
        console.error('Failed update', act.id, uerr);
      } else {
        updated++;
        if (updated % 50 === 0) console.log('Updated', updated, 'rows...');
      }
    }

    console.log('Done. Updated', updated, 'activities.');
  } catch (e) {
    console.error('Error overwriting seeds:', e);
    process.exit(1);
  }
})();
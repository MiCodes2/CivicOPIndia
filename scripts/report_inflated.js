#!/usr/bin/env node
// Report activities that exceed configured caps
// Usage: npx dotenv-cli -e .env.local -- node scripts/report_inflated.js

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
    const MAX_LIKES = process.env.SYNTHETIC_MAX_LIKES ? parseInt(process.env.SYNTHETIC_MAX_LIKES) : 1500;
    const MAX_SHARES = process.env.SYNTHETIC_MAX_SHARES ? parseInt(process.env.SYNTHETIC_MAX_SHARES) : 120;
    const MAX_VIEWS = process.env.SYNTHETIC_MAX_VIEWS ? parseInt(process.env.SYNTHETIC_MAX_VIEWS) : 500000;
    const INITIAL_LIKES_CAP = process.env.INITIAL_LIKES_CAP ? parseInt(process.env.INITIAL_LIKES_CAP) : 30;
    const INITIAL_SHARES_CAP = process.env.INITIAL_SHARES_CAP ? parseInt(process.env.INITIAL_SHARES_CAP) : 5;
    const INITIAL_VIEWS_CAP = process.env.INITIAL_VIEWS_CAP ? parseInt(process.env.INITIAL_VIEWS_CAP) : 4500;

    console.log('Caps:', { MAX_LIKES, MAX_SHARES, MAX_VIEWS, INITIAL_LIKES_CAP, INITIAL_SHARES_CAP, INITIAL_VIEWS_CAP });

    const { data, error } = await supabase
      .from('activities')
      .select('id,title,likes_count,shares_count,views_count,initial_likes_count,initial_shares_count,initial_views_count')
      .or(`likes_count.gt.${MAX_LIKES},shares_count.gt.${MAX_SHARES},views_count.gt.${MAX_VIEWS},initial_likes_count.gt.${INITIAL_LIKES_CAP},initial_shares_count.gt.${INITIAL_SHARES_CAP},initial_views_count.gt.${INITIAL_VIEWS_CAP}`)
      .order('likes_count', { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('No inflated activities found.');
      process.exit(0);
    }

    console.log('Inflated activities:');
    console.table(data.map(r => ({ id: r.id, title: r.title?.slice(0, 60), likes: r.likes_count, shares: r.shares_count, views: r.views_count, init_likes: r.initial_likes_count, init_shares: r.initial_shares_count, init_views: r.initial_views_count })));
  } catch (e) {
    console.error('Error reporting inflated activities:', e);
    process.exit(1);
  }
})();
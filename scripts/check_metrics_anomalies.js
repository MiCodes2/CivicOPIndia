#!/usr/bin/env node
// Scan activities for anomalies in likes/shares/views
// Usage: npx dotenv-cli -e .env.local -- node scripts/check_metrics_anomalies.js

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
    const { data: activities } = await supabase.from('activities').select('id,title,likes_count,shares_count,views_count,created_at').order('created_at',{ascending:false}).limit(500);
    if (!activities) { console.log('No activities'); process.exit(0); }

    const anomalies = [];
    for (const a of activities) {
      const likes = a.likes_count || 0;
      const shares = a.shares_count || 0;
      const views = a.views_count || 0;
      if (shares > likes) anomalies.push({ id: a.id, title: a.title, reason: 'shares>likes', likes, shares, views });
      if (likes > 0 && shares > Math.ceil(likes * 0.15)) anomalies.push({ id: a.id, title: a.title, reason: 'shares>15%likes', likes, shares, views });
      if (views > 0 && likes > views) anomalies.push({ id: a.id, title: a.title, reason: 'likes>views', likes, shares, views });
    }

    if (anomalies.length === 0) {
      console.log('No anomalies found');
      process.exit(0);
    }

    console.table(anomalies.slice(0,100));
    process.exit(0);
  } catch (e) {
    console.error('Error', e);
    process.exit(1);
  }
})();

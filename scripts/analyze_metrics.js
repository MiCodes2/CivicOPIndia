#!/usr/bin/env node
// Check current metrics data and identify potential issues

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const days = process.argv[2] ? parseInt(process.argv[2]) : 30;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

function toDayIso(d) {
  return new Date(d).toISOString().slice(0,10);
}

(async function analyzeMetrics() {
  console.log(`Analyzing metrics data for last ${days} days...`);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  // Get raw event data
  const [viewsRes, likesRes, sharesRes] = await Promise.all([
    supabase.from('activity_views').select('id, activity_id, user_id, visitor_id, created_at').gte('created_at', sinceIso),
    supabase.from('activity_likes').select('id, activity_id, user_id, ip_address, created_at').gte('created_at', sinceIso),
    supabase.from('activity_shares').select('id, activity_id, user_id, visitor_id, created_at').gte('created_at', sinceIso)
  ]);

  const views = viewsRes.data || [];
  const likes = likesRes.data || [];
  const shares = sharesRes.data || [];

  console.log(`\nRaw event counts:`);
  console.log(`Views: ${views.length}`);
  console.log(`Likes: ${likes.length}`);
  console.log(`Shares: ${shares.length}`);

  // Analyze shares for duplicates
  const shareGroups = new Map();
  for (const share of shares) {
    const key = `${share.activity_id}-${share.user_id || 'null'}-${share.visitor_id || 'null'}`;
    if (!shareGroups.has(key)) {
      shareGroups.set(key, []);
    }
    shareGroups.get(key).push(share);
  }

  let totalDuplicates = 0;
  let activitiesWithDuplicates = 0;

  for (const [key, groupShares] of shareGroups) {
    if (groupShares.length > 1) {
      totalDuplicates += groupShares.length - 1;
      activitiesWithDuplicates++;
    }
  }

  console.log(`\nShare analysis:`);
  console.log(`Unique user/activity combinations: ${shareGroups.size}`);
  console.log(`Activities with duplicate shares: ${activitiesWithDuplicates}`);
  console.log(`Total duplicate shares: ${totalDuplicates}`);

  // Check for shares > views per day
  const viewsByDay = {};
  const sharesByDay = {};

  for (const view of views) {
    const day = toDayIso(view.created_at);
    viewsByDay[day] = (viewsByDay[day] || 0) + 1;
  }

  for (const share of shares) {
    const day = toDayIso(share.created_at);
    sharesByDay[day] = (sharesByDay[day] || 0) + 1;
  }

  console.log(`\nDays where shares > views:`);
  let problematicDays = 0;
  for (const day in sharesByDay) {
    const dayShares = sharesByDay[day];
    const dayViews = viewsByDay[day] || 0;
    if (dayShares > dayViews) {
      console.log(`${day}: ${dayShares} shares, ${dayViews} views`);
      problematicDays++;
    }
  }

  if (problematicDays === 0) {
    console.log('None found - this is expected!');
  }

  // Summary
  console.log(`\nSummary:`);
  console.log(`- Total events: ${views.length + likes.length + shares.length}`);
  console.log(`- Shares/Views ratio: ${(shares.length / Math.max(views.length, 1)).toFixed(2)}`);
  console.log(`- Need deduplication: ${totalDuplicates > 0 ? 'YES' : 'NO'}`);

})().catch(console.error);
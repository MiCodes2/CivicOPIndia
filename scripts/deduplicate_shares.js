#!/usr/bin/env node
// Clean up duplicate shares: keep only the most recent share per user/visitor per activity

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function deduplicateShares() {
  console.log('Starting share deduplication...');

  // Get all shares ordered by activity_id, then by user_id/visitor_id, then by created_at DESC
  const { data: allShares, error } = await supabase
    .from('activity_shares')
    .select('id, activity_id, user_id, visitor_id, created_at')
    .order('activity_id', { ascending: true })
    .order('user_id', { ascending: true, nullsFirst: false })
    .order('visitor_id', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shares:', error);
    return;
  }

  if (!allShares || allShares.length === 0) {
    console.log('No shares to deduplicate');
    return;
  }

  console.log(`Found ${allShares.length} total shares`);

  // Group by activity and user/visitor combination
  const groups = new Map();
  for (const share of allShares) {
    const key = `${share.activity_id}-${share.user_id || 'null'}-${share.visitor_id || 'null'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(share);
  }

  // For each group, keep only the most recent share (first in the array since we ordered by created_at DESC)
  const idsToDelete = [];
  for (const [key, shares] of groups) {
    if (shares.length > 1) {
      // Keep the first (most recent), delete the rest
      const toDelete = shares.slice(1);
      idsToDelete.push(...toDelete.map(s => s.id));
      console.log(`Activity ${shares[0].activity_id}: keeping 1, deleting ${toDelete.length} duplicates`);
    }
  }

  if (idsToDelete.length === 0) {
    console.log('No duplicates found');
    return;
  }

  console.log(`Deleting ${idsToDelete.length} duplicate shares...`);

  // Delete in batches to avoid overwhelming the database
  const batchSize = 1000;
  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);
    const { error: deleteError } = await supabase
      .from('activity_shares')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error(`Error deleting batch ${i / batchSize + 1}:`, deleteError);
    } else {
      console.log(`Deleted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }

  console.log('Deduplication complete!');

  // Also update the shares_count in activities table to match the deduplicated data
  console.log('Recalculating shares_count for all activities...');

  const { data: activities, error: actError } = await supabase
    .from('activities')
    .select('id');

  if (actError) {
    console.error('Error fetching activities:', actError);
    return;
  }

  console.log(`Updating shares_count for ${activities?.length || 0} activities...`);

  for (const activity of activities || []) {
    const { count, error: countError } = await supabase
      .from('activity_shares')
      .select('id', { count: 'exact', head: true })
      .eq('activity_id', activity.id);

    if (countError) {
      console.error(`Error counting shares for activity ${activity.id}:`, countError);
      continue;
    }

    const { error: updateError } = await supabase
      .from('activities')
      .update({ shares_count: count || 0 })
      .eq('id', activity.id);

    if (updateError) {
      console.error(`Error updating shares_count for activity ${activity.id}:`, updateError);
    }
  }

  console.log('Shares count recalculation complete!');
}

deduplicateShares().catch(console.error);
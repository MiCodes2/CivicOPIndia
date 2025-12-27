#!/usr/bin/env node
// Recalculate shares_count for all activities based on activity_shares table

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function recalculateShares() {
  console.log('Recalculating shares_count for all activities...');

  const { data: activities, error: actError } = await supabase
    .from('activities')
    .select('id, shares_count');

  if (actError) {
    console.error('Error fetching activities:', actError);
    return;
  }

  console.log(`Found ${activities?.length || 0} activities to update`);

  let updated = 0;
  let totalShares = 0;

  for (const activity of activities || []) {
    const { count, error: countError } = await supabase
      .from('activity_shares')
      .select('id', { count: 'exact', head: true })
      .eq('activity_id', activity.id);

    if (countError) {
      console.error(`Error counting shares for activity ${activity.id}:`, countError);
      continue;
    }

    const newCount = count || 0;
    totalShares += newCount;

    if (newCount !== activity.shares_count) {
      const { error: updateError } = await supabase
        .from('activities')
        .update({ shares_count: newCount })
        .eq('id', activity.id);

      if (updateError) {
        console.error(`Error updating shares_count for activity ${activity.id}:`, updateError);
      } else {
        updated++;
      }
    }
  }

  console.log(`Updated ${updated} activities`);
  console.log(`Total shares across all activities: ${totalShares}`);
}

recalculateShares().catch(console.error);
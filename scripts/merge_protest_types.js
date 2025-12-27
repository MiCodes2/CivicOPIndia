#!/usr/bin/env node
// Merge 'protest' and 'protests' activity types into a single canonical 'Protests'
// Usage: npx dotenv-cli -e .env.local -- node scripts/merge_protest_types.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function run() {
  try {
    const { data: beforeTypes } = await supabase.from('activity_types').select('id,name');
    console.log('Before activity_types:', (beforeTypes || []).map(r => r.name));

    // Ensure canonical value exists
    const canonical = 'Protests';
    const { data: existing } = await supabase.from('activity_types').select('*').ilike('name', canonical);
    if (!existing || existing.length === 0) {
      const { error: insertErr } = await supabase.from('activity_types').insert([{ name: canonical }]);
      if (insertErr) throw insertErr;
      console.log(`Inserted canonical activity type '${canonical}'`);
    } else {
      console.log(`Canonical activity type '${canonical}' already present`);
    }

    // Update activities table to canonicalize types
    const variants = ['protest', 'protests'];
    const { data: activitiesBefore } = await supabase.from('activities').select('id,type').ilike('type', 'protest%');
    console.log(`Activities with protest variants (count: ${activitiesBefore?.length || 0})`);

    // Perform update
    const { error: updateErr } = await supabase
      .from('activities')
      .update({ type: canonical })
      .in('type', variants.map(v => v).map(v => v));

    if (updateErr) throw updateErr;
    console.log(`Updated activities -> '${canonical}'`);

    // Remove duplicate type rows (lowercase 'protest' if present) but keep canonical one
    const { data: allTypesAfter } = await supabase.from('activity_types').select('id,name');
    const toDelete = (allTypesAfter || []).filter(r => String(r.name).toLowerCase() === 'protest' && String(r.name) !== canonical);

    if (toDelete.length > 0) {
      const ids = toDelete.map(r => r.id);
      const { error: delErr } = await supabase.from('activity_types').delete().in('id', ids);
      if (delErr) throw delErr;
      console.log(`Deleted ${ids.length} duplicate activity_type rows for 'protest'`);
    } else {
      console.log('No duplicate lowercase "protest" activity_types found to delete');
    }

    const { data: afterTypes } = await supabase.from('activity_types').select('id,name');
    console.log('After activity_types:', (afterTypes || []).map(r => r.name));

    const { data: activitiesAfter } = await supabase.from('activities').select('id,type').eq('type', canonical);
    console.log(`Activities now with type '${canonical}': ${activitiesAfter?.length || 0}`);

    console.log('Done.');
  } catch (e) {
    console.error('Error during migration:', e);
    process.exit(1);
  }
}

run().then(() => process.exit(0));

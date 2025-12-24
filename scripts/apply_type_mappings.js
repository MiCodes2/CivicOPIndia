#!/usr/bin/env node
// Apply canonical type mappings to `activities.type` using SUPABASE_SERVICE_ROLE_KEY.

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

// Define mappings: each entry has `to` and array of `patterns` (ilike patterns)
const MAPPINGS = [
  { to: 'Drive', patterns: ['cleanliness drive', 'cleanliness', 'encroachment clearance', 'encroachment removal', 'encroachment'] },
  { to: 'Tree Plantation', patterns: ['tree plantation', 'treeplantation', 'tree-plantation'] },
  { to: 'Campaigns', patterns: ['campaign', 'campaigns'] },
];

(async function main(){
  console.log('Applying type mappings...');
  for (const map of MAPPINGS) {
    const to = map.to;
    const matchedIds = new Set();

    // Find matching rows for each pattern (case-insensitive)
    for (const pat of map.patterns) {
      const pattern = pat.includes('%') ? pat : pat;
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('id,type')
          .ilike('type', pattern);
        if (error) {
          console.error('Select error for pattern', pat, error);
          continue;
        }
        (data || []).forEach(r => matchedIds.add(r.id));
      } catch (e) {
        console.error('Unexpected error selecting pattern', pat, e);
      }
    }

    const ids = Array.from(matchedIds);
    if (ids.length === 0) {
      console.log(`No rows matched for mapping -> ${to}`);
      continue;
    }

    console.log(`Updating ${ids.length} rows to '${to}'`);
    // Update in small batches
    const BATCH = 200;
    for (let i=0;i<ids.length;i+=BATCH) {
      const chunk = ids.slice(i,i+BATCH);
      const { error } = await supabase
        .from('activities')
        .update({ type: to })
        .in('id', chunk);
      if (error) {
        console.error('Update error for chunk', chunk.slice(0,5), '...', error);
      } else {
        console.log(`Updated chunk ${i}/${ids.length}`);
      }
    }
  }

  console.log('Done.');
})();

#!/usr/bin/env node
// Find distinct activity.type values and counts, and highlight any variants matching /portest/i or /protest/i
// Usage: npx dotenv-cli -e .env.local -- node scripts/find_bad_types.js

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
    const { data } = await supabase.from('activities').select('type,count:id', { count: 'exact' });
    // The select above may not return grouped results, so fallback to SQL
    const { data: rows, error } = await supabase.rpc('get_activity_type_counts');
    if (error) {
      // If RPC not present, do raw SQL
      const { data: raw, error: rawErr } = await supabase
        .from('activities')
        .select('type, count')
        .rpc('get_activity_type_counts');
      if (rawErr) {
        // Do manual grouping client-side
        const { data: all } = await supabase.from('activities').select('id,type');
        const counts = {};
        (all || []).forEach(r => { const t = (r.type || '').toString(); counts[t] = (counts[t] || 0) + 1; });
        console.log('Type counts:');
        Object.entries(counts).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`${v}	${k}`));

        console.log('\nPotential matches for /portest|protest/i:');
        Object.entries(counts).forEach(([k,v]) => {
          if (/portest|protest/i.test(k)) console.log(`${v}\t${k}`);
        });
        return;
      }
    }
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

run().then(() => process.exit(0));

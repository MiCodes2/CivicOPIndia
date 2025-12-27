#!/usr/bin/env node
// List activities with types matching /prot|portest/i so we can inspect the remaining typo
// Usage: npx dotenv-cli -e .env.local -- node scripts/list_protest_variants.js

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
    // Get any types that contain prot or portest
    const { data: rows, error } = await supabase.from('activities').select('id,type,title').or("type.ilike.%prot%", { count: 'exact' });
    if (error) throw error;
    console.log('Activities with type matching /prot/i:');
    (rows || []).forEach(r => console.log(`${r.id}\t${r.type}\t${r.title || ''}`));

    // Also specifically look for 'portest'
    const { data: pRows } = await supabase.from('activities').select('id,type,title').ilike('type','%portest%');
    if (pRows && pRows.length) {
      console.log('\nFound portest variants:');
      pRows.forEach(r => console.log(`${r.id}\t${r.type}\t${r.title || ''}`));
    } else {
      console.log('\nNo portest variants found via ilike');
    }
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

run().then(() => process.exit(0));

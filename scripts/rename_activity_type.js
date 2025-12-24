#!/usr/bin/env node
// Rename activity_types entries from 'Press Conference' variants to 'News'
// Usage: npx dotenv-cli -e .env.local -- node scripts/rename_activity_type.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function beforeAfter() {
  const { data: before } = await supabase.from('activity_types').select('name');
  console.log('Before activity_types:', (before || []).map(r => r.name));

  const { error } = await supabase
    .from('activity_types')
    .update({ name: 'News' })
    .ilike('name', '%press conference%');

  if (error) console.error('Update error:', error);

  const { data: after } = await supabase.from('activity_types').select('name');
  console.log('After activity_types:', (after || []).map(r => r.name));
}

beforeAfter().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

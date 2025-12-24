#!/usr/bin/env node
// Populate tags for all activities by extracting hashtags from content.
// Usage: npx dotenv-cli -e .env.local -- node scripts/populate_tags.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

function extractTagsFromText(text) {
  if (!text) return [];
  const stripped = text.replace(/<[^>]*>/g, ' ');
  const re = /#([a-zA-Z0-9_\-]+)/g;
  const set = new Set();
  let m;
  while ((m = re.exec(stripped)) !== null) {
    const t = (m[1] || '').toLowerCase();
    if (t) set.add(t);
  }
  return Array.from(set);
}

async function main() {
  try {
    console.log('Fetching activities...');
    const { data: rows, error: fetchErr } = await supabase.from('activities').select('id, content, tags');
    if (fetchErr) {
      console.error('Fetch error:', fetchErr);
      process.exit(1);
    }

    const updates = [];
    for (const r of (rows || [])) {
      const id = Number(r.id);
      const content = (r.content || '').toString();
      const existing = Array.isArray(r.tags) ? r.tags.map(String).map(s => s.toLowerCase()) : [];
      const extracted = extractTagsFromText(content);
      const existingSet = new Set(existing);
      const extractedSet = new Set(extracted);
      const same = existingSet.size === extractedSet.size && Array.from(existingSet).every(s => extractedSet.has(s));
      if (extracted.length > 0 && !same) {
        updates.push({ id, tags: extracted });
      }
    }

    console.log(`Will update ${updates.length} rows`);
    let updated = 0;
    for (const u of updates) {
      const { error } = await supabase.from('activities').update({ tags: u.tags }).eq('id', u.id);
      if (error) console.error('Update error for', u.id, error);
      else updated++;
    }

    console.log(`Updated ${updated} rows.`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

main();

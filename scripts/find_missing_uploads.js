/*
Usage:
  node scripts/find_missing_uploads.js [filename]

Examples:
  node scripts/find_missing_uploads.js 1766736865524_660wyitcsvd.jpg
  node scripts/find_missing_uploads.js

The script will:
 - Query the `activities` table for rows where `image_url` or `content` references `/uploads/`
 - For each found reference, check whether the corresponding file exists in `public/uploads`
 - Print a short report

Requires environment variables (same as local dev):
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY

*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const filenameArg = process.argv[2] || null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  // Build filter: either a specific filename or all /uploads/
  let filterQuery = "%/uploads/%";
  if (filenameArg) filterQuery = `%${filenameArg}%`;

  console.log('Querying activities for references to:', filterQuery);

  // Supabase SQL-like filter using .or
  const { data, error } = await supabase
    .from('activities')
    .select('id,title,image_url,content')
    .or(`image_url.like.${encodeURIComponent(filterQuery)},content.like.${encodeURIComponent(filterQuery)}`)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('Supabase query error:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No matching activities found.');
    return;
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  const results = [];
  for (const row of data) {
    const matches = [];
    if (row.image_url && row.image_url.includes('/uploads/')) matches.push(row.image_url);
    if (row.content) {
      const re = /\/uploads\/[\w\-_.]+/g;
      const found = row.content.match(re) || [];
      for (const f of found) matches.push(f);
    }
    for (const m of matches) {
      const mName = m.replace(/^\/+uploads\//, '');
      const filePath = path.join(uploadsDir, mName);
      const exists = fs.existsSync(filePath);
      results.push({ id: row.id, title: row.title, reference: m, filePath, exists });
    }
  }

  if (results.length === 0) {
    console.log('No upload references found in matched activities.');
    return;
  }

  console.log('\nReport:');
  for (const r of results) {
    console.log(`- Activity ${r.id} (${r.title || 'untitled'}): ${r.reference} -> ${r.exists ? 'FOUND' : 'MISSING'}`);
  }

  const missing = results.filter(r => !r.exists);
  console.log(`\nSummary: ${results.length} references checked, ${missing.length} missing.`);

  if (missing.length > 0) {
    console.log('\nMissing details:');
    for (const m of missing) console.log(`- missing file: ${m.filePath} referenced by activity ${m.id}`);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

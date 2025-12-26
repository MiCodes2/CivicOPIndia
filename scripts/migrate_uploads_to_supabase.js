/*
Migrate local `public/uploads/*` files referenced by `activities` to Supabase Storage and update DB references.

Usage:
  node scripts/migrate_uploads_to_supabase.js

Environment variables required:
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - UPLOAD_BACKEND=supabase (script uses supabase upload helper)

This script will:
 - Query activities for `/uploads/` references
 - For each referenced filename, check if local file exists under public/uploads
 - If exists, upload to Supabase and replace references in image_url and content
 - Print a summary

Notes: run this locally where public/uploads files exist. It will skip missing local files.
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dryRun = process.argv.includes('--dry-run');

  if (!dryRun && (!supabaseUrl || !serviceKey)) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env (or run with --dry-run to preview)');
    process.exit(1);
  }

  process.env.UPLOAD_BACKEND = 'supabase'; // ensure supabase adapter is used

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const supabase = (!dryRun && createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })) || null;

  const { data } = await (supabase ? supabase.from('activities').select('id,title,image_url,content').limit(1000) : createClientPreview());
  if (!data || data.length === 0) {
    console.log('No activities found');
    return;
  }

  const { uploadToSupabase } = require('../lib/storage/supabase');

  let migrated = 0;
  for (const row of data) {
    const refs = [];
    if (row.image_url && row.image_url.includes('/uploads/')) refs.push(row.image_url);
    if (row.content) {
      const found = row.content.match(/\/uploads\/[\w\-_.]+/g) || [];
      for (const f of found) refs.push(f);
    }
    if (refs.length === 0) continue;

    let changed = false;
    let content = row.content || '';
    let image_url = row.image_url || '';

    for (const r of refs) {
      const name = r.replace(/^\/+uploads\//, '');
      const filePath = path.join(uploadsDir, name);
      if (!fs.existsSync(filePath)) {
        console.log('Skipping missing local file:', filePath);
        continue;
      }

      if (dryRun) {
        console.log('[dry-run] Would upload:', filePath, 'referenced in activity', row.id);
        continue;
      }

      const buf = fs.readFileSync(filePath);
      try {
        console.log('Uploading', filePath, 'to Supabase...');
        const res = await uploadToSupabase(buf, null, name);
        console.log('Uploaded ->', res.url);
        // Replace in content and image_url
        content = content.split(r).join(res.url);
        if (image_url === r) image_url = res.url;
        changed = true;
        migrated++;
      } catch (e) {
        console.error('Failed to upload', filePath, e);
      }
    }

    if (!dryRun && changed) {
      try {
        await supabase.from('activities').update({ content, image_url }).eq('id', row.id);
        console.log('Updated activity', row.id);
      } catch (e) {
        console.error('Failed to update activity', row.id, e);
      }
    }
  }

  console.log('\nMigration done. Files migrated:', migrated);
  if (dryRun) console.log('Dry-run complete. Run without --dry-run to perform the migration.');
}

function createClientPreview() {
  // Minimal preview: return an object with data array of activities by reading DB is not possible in dry-run without creds
  // Instead, fetch activities via the public anon key if available, else error
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!publicUrl || !anonKey) {
    console.error('Dry-run requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to be set to fetch activities');
    process.exit(1);
  }
  const client = createClient(publicUrl, anonKey, { auth: { persistSession: false } });
  return client.from('activities').select('id,title,image_url,content').limit(1000);
}

main().catch(e => { console.error(e); process.exit(1); });

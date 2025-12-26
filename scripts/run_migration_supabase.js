#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    const env = fs.readFileSync(filePath, 'utf8');
    env.split(/\n/).forEach(l => {
      const m = l.match(/^\s*([A-Z0-9_]+)=(.*)$/i);
      if (m) process.env[m[1]] = m[2];
    });
  } catch (e) {}
}

async function main() {
  loadEnvFile('.env.local');
  process.env.SUPABASE_UPLOAD_BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || 'CivicOPI';

  const { createClient } = require('@supabase/supabase-js');
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const q = await s.from('activities').select('id,title,image_url,content').ilike('image_url','%/uploads/%').limit(1000);
  let rows = q.data || [];
  const q2 = await s.from('activities').select('id,title,image_url,content').ilike('content','%/uploads/%').limit(1000);
  if (q2.data) rows = rows.concat(q2.data);
  const unique = new Map();
  for (const r of rows) unique.set(r.id, r);
  rows = Array.from(unique.values());

  if (rows.length === 0) { console.log('No activities found to migrate.'); return; }

  let migrated = 0;
  for (const r of rows) {
    const refs = [];
    if (r.image_url && r.image_url.includes('/uploads/')) refs.push(r.image_url);
    if (r.content) {
      const found = r.content.match(/\/uploads\/[\w\-_.]+/g) || [];
      for (const f of found) refs.push(f);
    }

    let content = r.content || '';
    let image_url = r.image_url || '';
    let changed = false;

    for (const ref of refs) {
      const name = ref.replace(/^\/+uploads\//, '');
      const filePath = path.join(process.cwd(), 'public', 'uploads', name);
      if (!fs.existsSync(filePath)) {
        console.log('Skipping missing file for', r.id, name);
        continue;
      }

      const buf = fs.readFileSync(filePath);
      try {
        console.log('Uploading', filePath, 'to bucket', process.env.SUPABASE_UPLOAD_BUCKET);
        const { data, error } = await s.storage.from(process.env.SUPABASE_UPLOAD_BUCKET).upload(name, buf, { contentType: 'application/octet-stream', upsert: true });
        if (error && !data) { console.error('Upload error for', name, error); continue; }
        const { publicUrl } = s.storage.from(process.env.SUPABASE_UPLOAD_BUCKET).getPublicUrl(name);
        console.log('Uploaded ->', publicUrl);
        content = content.split(ref).join(publicUrl);
        if (image_url === ref) image_url = publicUrl;
        changed = true;
        migrated++;
      } catch (e) {
        console.error('Failed uploading', filePath, e);
      }
    }

    if (changed) {
      try {
        await s.from('activities').update({ content, image_url }).eq('id', r.id);
        console.log('Updated activity', r.id);
      } catch (e) {
        console.error('Failed updating activity', r.id, e);
      }
    }
  }

  console.log('Migration complete. Files migrated:', migrated);
}

main().catch(e => { console.error(e); process.exit(1); });

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

  let updated = 0;
  const bucket = process.env.SUPABASE_UPLOAD_BUCKET;
  const list = await s.storage.from(bucket).list('', { limit: 1000 });
  const available = new Set((list.data||[]).map(i=>i.name));

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
      if (!available.has(name)) {
        console.log('Bucket missing', name, 'skip for activity', r.id);
        continue;
      }
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/,'')}/storage/v1/object/public/${bucket}/${encodeURIComponent(name)}`;
      if (content.includes(ref)) { content = content.split(ref).join(publicUrl); changed = true; }
      if (image_url === ref) { image_url = publicUrl; changed = true; }
    }

    if (changed) {
      try {
        await s.from('activities').update({ content, image_url }).eq('id', r.id);
        updated++;
        console.log('Patched activity', r.id);
      } catch (e) {
        console.error('Failed patch', r.id, e);
      }
    }
  }

  console.log('Done. Activities patched:', updated);
}

main().catch(e=>{ console.error(e); process.exit(1); });

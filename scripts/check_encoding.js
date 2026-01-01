#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkContent() {
  const { data } = await supabase.from('activities').select('id, title, content').limit(10).order('id', { ascending: false });
  
  data.forEach(a => {
    console.log(`\n=== Activity ${a.id} ===`);
    console.log('Title:', a.title?.substring(0, 100));
    const snippet = a.content?.substring(0, 200);
    console.log('Content snippet:', snippet);
    
    // Check for various encodings
    if (snippet?.includes('&#039')) console.log('  ⚠️ Contains &#039');
    if (snippet?.includes('&amp;#039')) console.log('  ⚠️ Contains &amp;#039 (double encoded)');
    if (snippet?.includes('&apos')) console.log('  ⚠️ Contains &apos');
    if (snippet?.includes("'")) console.log('  ✓ Contains normal apostrophe');
  });
}

checkContent();

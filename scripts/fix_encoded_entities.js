#!/usr/bin/env node

/**
 * Fix encoded HTML entities in existing database records
 * This script decodes &#039; and similar entities from activity content
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function decodeHtmlEntities(str) {
  if (!str) return '';
  
  // Decode common numeric entities
  let decoded = str
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  
  // Decode any remaining numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (m, code) => String.fromCharCode(parseInt(code, 16)));
  
  return decoded;
}

async function fixEncodedEntities() {
  console.log('Fetching activities with encoded entities...');
  
  // Get all activities
  const { data: activities, error } = await supabase
    .from('activities')
    .select('id, title, content')
    .or('title.ilike.%&#%,content.ilike.%&#%');
  
  if (error) {
    console.error('Error fetching activities:', error);
    return;
  }
  
  console.log(`Found ${activities.length} activities with potential encoded entities`);
  
  let fixed = 0;
  for (const activity of activities) {
    const updates = {};
    let needsUpdate = false;
    
    if (activity.title && activity.title.includes('&#')) {
      updates.title = decodeHtmlEntities(activity.title);
      needsUpdate = true;
    }
    
    if (activity.content && activity.content.includes('&#')) {
      updates.content = decodeHtmlEntities(activity.content);
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', activity.id);
      
      if (updateError) {
        console.error(`Error updating activity ${activity.id}:`, updateError);
      } else {
        console.log(`✓ Fixed activity ${activity.id}`);
        fixed++;
      }
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} activities`);
}

fixEncodedEntities().catch(console.error);

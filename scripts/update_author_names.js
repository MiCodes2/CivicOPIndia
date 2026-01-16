#!/usr/bin/env node

/**
 * Update author_name from 'Unknown' or NULL to 'Civic Admin' in activities and events tables
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateActivities() {
  console.log('\n📝 Updating activities table...');
  
  // Update records where author_name is NULL or 'Unknown'
  const { data, error, count } = await supabase
    .from('activities')
    .update({ author_name: 'Civic Admin' })
    .or('author_name.is.null,author_name.eq.Unknown')
    .select('id');

  if (error) {
    console.error('Error updating activities:', error);
    return;
  }

  console.log(`✅ Updated ${data?.length || 0} activities`);
  return data;
}

async function updateEvents() {
  console.log('\n📅 Updating events table...');
  
  // Update records where author_name is NULL or 'Unknown' or 'Admin'
  const { data, error, count } = await supabase
    .from('events')
    .update({ author_name: 'Civic Admin' })
    .or('author_name.is.null,author_name.eq.Unknown,author_name.eq.Admin')
    .select('id');

  if (error) {
    console.error('Error updating events:', error);
    return;
  }

  console.log(`✅ Updated ${data?.length || 0} events`);
  return data;
}

async function main() {
  console.log('🔄 Starting author name updates...');
  
  await updateActivities();
  await updateEvents();
  
  console.log('\n✨ Done!\n');
}

main().catch(console.error);

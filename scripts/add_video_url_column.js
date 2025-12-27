#!/usr/bin/env node
// Run the video_url migration

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function runMigration() {
  console.log('🔄 Adding video_url column to activities table...\n');

  try {
    // Check if column already exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'activities')
      .eq('column_name', 'video_url');

    if (checkError) {
      console.error('Error checking for column:', checkError);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('✅ video_url column already exists');
      return;
    }

    // Run the migration using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE activities ADD COLUMN IF NOT EXISTS video_url TEXT;'
    });

    if (error) {
      console.error('Error running migration:', error);
      console.log('Trying direct approach...');

      // Try using the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({
          sql: 'ALTER TABLE activities ADD COLUMN IF NOT EXISTS video_url TEXT;'
        })
      });

      if (!response.ok) {
        console.error('Direct SQL execution failed. Please run this migration manually in your Supabase dashboard:');
        console.log('ALTER TABLE activities ADD COLUMN IF NOT EXISTS video_url TEXT;');
        return;
      }

      const result = await response.json();
      if (result.error) {
        console.error('Migration failed:', result.error);
        return;
      }
    }

    console.log('✅ Successfully added video_url column to activities table');

  } catch (err) {
    console.error('Migration failed:', err);
    console.log('Please run this migration manually in your Supabase dashboard:');
    console.log('ALTER TABLE activities ADD COLUMN IF NOT EXISTS video_url TEXT;');
  }
}

runMigration();
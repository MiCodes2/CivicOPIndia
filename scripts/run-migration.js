const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Note: For migrations, you typically need the service role key
// But let's try with a direct SQL execution approach

async function runMigration() {
  console.log('🔄 Running database migration...\n');

  const migration1 = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/001_activities_schema.sql'),
    'utf8'
  );

  const migration2 = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/002_add_author_name.sql'),
    'utf8'
  );

  console.log('📋 Migration SQL:');
  console.log('================');
  console.log(migration1);
  console.log('\n' + migration2);
  console.log('================\n');

  console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:');
  console.log('🔗 https://app.supabase.com/project/lzpyfvqdimkrkioxrzbf/sql\n');
  console.log('Steps:');
  console.log('1. Click the link above to open Supabase SQL Editor');
  console.log('2. Copy the SQL shown above');
  console.log('3. Paste it into the SQL Editor');
  console.log('4. Click "Run" button');
  console.log('5. Refresh your app at http://localhost:3000/admin/dashboard\n');
}

runMigration();

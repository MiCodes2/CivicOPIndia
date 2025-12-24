#!/usr/bin/env node
/*
  Delete demo campaign activities from the `activities` table.
  Usage:
    SUPABASE_SERVICE_ROLE_KEY=your_service_key node scripts/delete_campaigns.js
  Or if you keep keys in .env.local:
    npx dotenv -e .env.local -- node scripts/delete_campaigns.js
*/

(async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const readline = await import('readline');

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
      console.error('Set SUPABASE_SERVICE_ROLE_KEY and re-run the script.');
      process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Find matching rows (case-insensitive contains 'campaign')
    const { data: rows, error: fetchErr } = await supabase
      .from('activities')
      .select('id,title,type,author_name,created_at')
      .ilike('type', '%campaign%');

    if (fetchErr) {
      console.error('Failed to query activities:', fetchErr);
      process.exit(1);
    }

    if (!rows || rows.length === 0) {
      console.log('No campaign-style activities found (type ILIKE "%campaign%")');
      process.exit(0);
    }

    console.log(`Found ${rows.length} matching activities:`);
    rows.forEach((r) => console.log(`  id=${r.id} type=${r.type} title="${r.title || ''}" author=${r.author_name || ''} created_at=${r.created_at}`));

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((res) => rl.question('Delete these rows? Type YES to confirm: ', res));
    rl.close();

    if (String(answer).trim() !== 'YES') {
      console.log('Aborted by user. No rows deleted.');
      process.exit(0);
    }

    const { error: delErr, data: delData } = await supabase
      .from('activities')
      .delete()
      .ilike('type', '%campaign%');

    if (delErr) {
      console.error('Delete failed:', delErr);
      process.exit(1);
    }

    console.log(`Deleted ${Array.isArray(delData) ? delData.length : 'unknown'} rows.`);
  } catch (e) {
    console.error('Script failed:', e);
    process.exit(1);
  }
})();

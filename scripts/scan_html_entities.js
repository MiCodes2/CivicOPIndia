/**
 * Scan activities and events for HTML numeric/entity sequences (e.g., '&#039;', '&amp;#039;')
 * and print counts + sample rows to help verify whether any persisted rows still contain encodings.
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/scan_html_entities.js
 */

// Using dynamic imports to avoid top-level CommonJS `require()` and satisfy lint rules

(async function main() {
  // Load env and supabase client via dynamic import
  await (await import('dotenv')).config({ path: process.env.DOTENV_PATH || '.env.local' });
  const { createClient } = (await import('@supabase/supabase-js'));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment and re-run');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Regex patterns to look for
  const patterns = [
    "&#\\d+;",
    "&#x[0-9a-fA-F]+;",
    "&amp;#\\d+;",
    "&amp;#x[0-9a-fA-F]+;",
    "&apos;",
    "&#039;"
  ];

  for (const table of ['activities', 'events']) {
    console.log('\nScanning table:', table);
    try {
      // Use Postgres regex operator ~ to find matches in title or content
      const where = `title ~ '${patterns[0]}' OR title ~ '${patterns[1]}' OR title ILIKE '%&amp;#%' OR title ILIKE '%&apos;%' OR content ~ '${patterns[0]}' OR content ~ '${patterns[1]}' OR content ILIKE '%&amp;#%' OR content ILIKE '%&apos;%';`;

      // Limit: small sampling
      const { data: rows, error } = await supabase
        .from(table)
        .select('id,title,content')
        .or(`title.ilike.%25&amp;#%25,content.ilike.%25&amp;#%25, title.ilike.%25&amp;apos;%25, content.ilike.%25&amp;apos;%25`)
        .limit(10);

      if (error) {
        console.error('Query error:', error.message || error);
        continue;
      }

      // Compute counts by checking common patterns using ilike
      const checks = [
        { field: 'title', pattern: '%&#%' },
        { field: 'content', pattern: '%&#%' },
        { field: 'title', pattern: '%&amp;#%' },
        { field: 'content', pattern: '%&amp;#%' },
        { field: 'title', pattern: '%&apos;%' },
        { field: 'content', pattern: '%&apos;%' },
      ];

      let total = 0;
      for (const c of checks) {
        const { count, error: cntErr } = await supabase.from(table).select('id', { count: 'exact' }).ilike(c.field, c.pattern);
        if (cntErr) continue;
        total += (typeof count === 'number' ? count : 0);
      }

      console.log(`Sample rows (up to 10) with possible entities: ${rows.length}`);
      rows.forEach(r => {
        console.log(`- id=${r.id} title=${(r.title||'').slice(0,120)} content=${(r.content||'').slice(0,120)}`);
      });

      console.log('Total matches (sum of pattern checks, may double-count rows matching multiple patterns):', total);

    } catch (e) {
      console.error('Error scanning', e.message || e);
    }
  }

  console.log('\nScan complete. If you want, run scripts/fix_html_entities.js --dry-run to see exact updates.');
})();

npx dotenv-cli -e .env.local -- node scripts/scan_html_entities.jsnpx dotenv-cli -e .env.local -- node scripts/scan_html_entities.js/**
 * Scan activities and events for HTML entities like &#039; or &amp;#039; in title/content
 * and normalize them to real characters. Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
 * Run: node scripts/fix_html_entities.js --dry-run
 */

const { createClient } = require('@supabase/supabase-js');

function decodeEntities(str) {
  if (!str) return '';
  // Basic named/decimal/hex decode
  let s = String(str);
  s = s.replace(/&amp;/g, '&');
  s = s.replace(/&lt;/g, '<');
  s = s.replace(/&gt;/g, '>');
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&apos;/g, "'");
  s = s.replace(/&#039;/g, "'");
  s = s.replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)));
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (m, code) => String.fromCharCode(parseInt(code, 16)));
  return s;
}

function normalize(str, strict = false) {
  let prev = String(str);
  for (let i = 0; i < 6; i++) {
    const dec = decodeEntities(prev);
    if (dec === prev) break;
    prev = dec;
  }

  if (strict) {
    // aggressive fixes for broken encodings
    prev = prev.replace(/&amp;#\s*0*39;|&\s*#\s*0*39;|&#x27;/gi, "'");
    prev = prev.replace(/&amp;#\s*(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
    prev = prev.replace(/&amp;#x\s*([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    prev = prev.replace(/[\u200B-\u200D\uFEFF]/g, '');
    prev = prev.replace(/\\+'/g, "'");
    prev = prev.replace(/\s+/g, ' ').trim();
    prev = prev.replace(/[‘’‚‛]/g, "'");
    prev = prev.replace(/[“”„‟]/g, '"');
  }

  return prev;
}

(async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dryRun = process.argv.includes('--dry-run');
  const strict = process.argv.includes('--strict');
  if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const table of ['activities', 'events']) {
    console.log('Scanning', table);
    const { data: rows, error } = await supabase.from(table).select('id,title,content').limit(1000);
    if (error) { console.error('Error fetching', table, error); continue; }
    for (const r of rows || []) {
      const newTitle = r.title ? normalize(r.title, strict) : r.title;
      const newContent = r.content ? normalize(r.content, strict) : r.content;
      if (newTitle !== r.title || newContent !== r.content) {
        console.log(`Would update ${table} id=${r.id} title: ${String(r.title).slice(0,80)} -> ${String(newTitle).slice(0,80)}`);
        if (!dryRun) {
          const upd = {};
          if (newTitle !== r.title) upd.title = newTitle;
          if (newContent !== r.content) upd.content = newContent;
          const { error: uErr } = await supabase.from(table).update(upd).eq('id', r.id);
          if (uErr) console.error('Failed to update', r.id, uErr);
          else console.log('Updated', table, r.id);
        }
      }
    }
  }
  console.log('Done');
})();

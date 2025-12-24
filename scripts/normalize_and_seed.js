#!/usr/bin/env node
// Normalize `activities.type` values and seed demo posts if needed.
// Usage:
// - Provide NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY.
// - Recommended: run with dotenv: `npx dotenv -e .env.local -- node scripts/normalize_and_seed.js`

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in env');
  process.exit(1);
}

const useService = !!serviceKey;
const usedKey = serviceKey || anonKey;
if (!usedKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in env');
  process.exit(1);
}

if (useService) console.log('Using SUPABASE_SERVICE_ROLE_KEY (privileged ops enabled)');
else console.log('Using anon/public key — privileged ops (insert/update) may be blocked by RLS');

const supabase = createClient(supabaseUrl, usedKey, {
  auth: { persistSession: false }
});

// Mapping rules: array of { patterns: [regex strings], to: canonical }
const RULES = [
  { patterns: ['^meeting$','^meetings$'], to: 'Meetings' },
  { patterns: ['^campaign$','^campaigns$'], to: 'Campaigns' },
  { patterns: ['^protest$','^protests$'], to: 'Protests' },
  { patterns: ['^workshop$','^workshops$'], to: 'Workshops' },
  { patterns: ['^tree ?plantation$','^treeplantation$','^tree-plantation$'], to: 'Tree Plantation' },
  { patterns: ['^cleanliness ?drive$','^cleanliness$'], to: 'Cleanliness Drive' },
  { patterns: ['^encroachment.*$','^encroachment clearance$','^encroachment removal$','^encroachment$'], to: 'Encroachment Clearance' },
  { patterns: ['^rally$','^rallies$'], to: 'Rally' },
  { patterns: ['^press conference$'], to: 'Press Conference' },
  { patterns: ['^other$'], to: 'Other' },
];

async function normalizeTypes() {
  console.log('Fetching distinct types...');
  const { data: typesData, error: typesErr } = await supabase
    .from('activities')
    .select('type', { distinct: true });

  if (typesErr) {
    console.error('Error fetching types:', typesErr);
    return;
  }

  const distinct = (typesData || []).map((r) => r.type).filter(Boolean);
  console.log('Found distinct types:', distinct);

  // For each distinct type value in DB, decide whether to map it to a canonical label.
  for (const orig of distinct) {
    const origNorm = (orig || '').toString().toLowerCase().trim();
    let matchedRule = null;
    for (const rule of RULES) {
      for (const pat of rule.patterns) {
        const re = new RegExp(pat, 'i');
        if (re.test(origNorm)) {
          matchedRule = rule;
          break;
        }
      }
      if (matchedRule) break;
    }

    if (matchedRule) {
      const target = matchedRule.to;
      if (orig !== target) {
        console.log(`Mapping '${orig}' => '${target}'`);
        // Update rows where type exactly equals the original value (preserve other variants)
        const { error: updErr } = await supabase
          .from('activities')
          .update({ type: target })
          .eq('type', orig);
        if (updErr) console.error('Update error for', orig, updErr);
        else console.log(`Updated rows: '${orig}' => '${target}'`);
      } else {
        console.log(`'${orig}' already canonical`);
      }
    } else {
      console.log(`No mapping rule for '${orig}', leaving as-is (judicial use)`);
    }
  }
}

async function seedDemo(targetCounts = { 'Campaigns': 4 }) {
  console.log('Checking counts to seed demo activities...');
  const { data: countsData, error: countsErr } = await supabase
    .from('activities')
    .select('type, id');
  if (countsErr) { console.error('Counts fetch error:', countsErr); return; }

  const counts = {};
  (countsData || []).forEach((r) => {
    const t = (r.type || '').toString();
    counts[t] = (counts[t] || 0) + 1;
  });

  for (const [type, desired] of Object.entries(targetCounts)) {
    const current = counts[type] || 0;
    const toCreate = Math.max(0, desired - current);
    if (toCreate > 0) {
      console.log(`Inserting ${toCreate} demo activities for type=${type}`);
      if (!useService) {
        console.warn('Skipping inserts because service role key is not provided (RLS will likely block inserts).');
        continue;
      }
      for (let i=0;i<toCreate;i++) {
        const payload = {
          title: `${type} - Demo Post ${i+1}`,
          content: `<p>Demo ${type} post created for presentation.</p>`,
          activity_date: new Date().toISOString(),
          type,
          likes_count: 0,
          shares_count: 0,
          author_name: 'Demo',
        };
        const { error: insertErr } = await supabase.from('activities').insert([payload]);
        if (insertErr) console.error('Insert error:', insertErr);
        else console.log('Inserted demo row for', type);
      }
    } else {
      console.log(`No need to insert for ${type} (current ${current} >= ${desired})`);
    }
  }
}

async function main() {
  try {
    await normalizeTypes();
    await seedDemo({ 'Campaigns': 4 });
    console.log('Done.');
  } catch (e) {
    console.error('Error running script', e);
  }
}

main();

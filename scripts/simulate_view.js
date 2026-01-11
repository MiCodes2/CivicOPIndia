#!/usr/bin/env node
// Simulate a view event for testing. Usage:
// npx dotenv-cli -e .env.local -- node scripts/simulate_view.js 27 test_visitor_x

// Using dynamic imports to avoid top-level CommonJS `require()` and satisfy lint rules

async function run() {

async function run() {
  // Load env and create supabase client dynamically
  await (await import('dotenv')).config();
  const { createClient } = (await import('@supabase/supabase-js'));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const args = process.argv.slice(2);
  const activityId = args[0] ? Number(args[0]) : 27;
  const visitorId = args[1] || `test_visitor_${Math.floor(Math.random()*10000)}`;

  try {
    console.log('Simulating view for activity', activityId, 'visitor', visitorId);
    const { error: insertErr } = await supabase.from('activity_views').insert([{ activity_id: activityId, visitor_id: visitorId }]);
    if (insertErr) throw insertErr;
    const { data: existing } = await supabase.from('activities').select('views_count').eq('id', activityId).maybeSingle();
    const cur = (existing?.views_count ?? 0) || 0;
    const { data: updated, error: updateErr } = await supabase.from('activities').update({ views_count: cur + 1 }).eq('id', activityId).select('views_count').maybeSingle();
    if (updateErr) throw updateErr;
    console.log('Updated views_count ->', updated?.views_count ?? cur + 1);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

run();

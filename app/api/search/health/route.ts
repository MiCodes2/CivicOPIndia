import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    // quick checks: call search_functions with a harmless query
    const { data: a, error: e1 } = await supabase.rpc('search_activities_count', { in_query: '', in_type: null, in_tag: null }) as any;
    const { data: b, error: e2 } = await supabase.rpc('search_facets', { in_query: '', in_type: null, in_tag: null }) as any;
    const checks = [] as any[];
    if (e1) checks.push({ name: 'search_activities_count', ok: false, message: e1.message }); else checks.push({ name: 'search_activities_count', ok: true });
    if (e2) checks.push({ name: 'search_facets', ok: false, message: e2.message }); else checks.push({ name: 'search_facets', ok: true });

    const ok = checks.every(c => c.ok === true);
    return NextResponse.json({ ok, checks });
  } catch (err:any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

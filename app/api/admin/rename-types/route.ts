import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mappings: Array<{ from: string; to: string }> = body.mappings || [];
    if (!Array.isArray(mappings) || mappings.length === 0) {
      return NextResponse.json({ error: 'No mappings provided' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const results: Array<{ from: string; to: string; error?: any }> = [];
    for (const m of mappings) {
      const from = (m.from || '').toString();
      const to = (m.to || '').toString();
      if (!from || !to) { results.push({ from, to, error: 'invalid mapping' }); continue; }

      const { error } = await supabase.from('activities').update({ type: to }).eq('type', from);
      results.push({ from, to, error: error || null });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.activityId;
    if (!id) return NextResponse.json({ error: 'Missing activityId' }, { status: 400 });

    const supabase = await createServerClient();

    // Fetch current value
    const { data: existing } = await supabase.from('activities').select('shares_count').eq('id', id).maybeSingle();
    const cur = (existing?.shares_count ?? 0) as number;

    const { data, error } = await supabase.from('activities').update({ shares_count: cur + 1 }).eq('id', id).select('shares_count').maybeSingle();
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json({ shares_count: data?.shares_count ?? cur + 1 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
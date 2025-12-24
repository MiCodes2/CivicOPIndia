import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const w_rank = parseFloat(url.searchParams.get('w_rank') || '0.8');
    const w_tag = parseFloat(url.searchParams.get('w_tag') || '0.3');
    const w_title = parseFloat(url.searchParams.get('w_title') || '0.5');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 100);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('search_preview', { in_query: q, w_rank, w_tag, w_title, in_limit: limit }) as any;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ results: data || [] });
  } catch (err:any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

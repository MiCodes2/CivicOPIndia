import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '8', 10) || 8, 50);

    if (!q) return NextResponse.json({ suggestions: [] });

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('suggest_activities', { in_prefix: q, in_limit: limit }) as any;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let suggestions = data || [];
    // fallback to trigram title matches if no suggestions
    if ((!suggestions || suggestions.length === 0) && q && q.length >= 2) {
      try {
        const { data: trig, error: trigErr } = await supabase.rpc('search_trigram', { in_query: q, in_limit: limit }) as any;
        if (!trigErr && trig && trig.length) {
          suggestions = (trig || []).map((s:any)=>({ id: s.id, title: s.title, excerpt: s.content ? s.content.slice(0,200) : '' }));
        }
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({ suggestions });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

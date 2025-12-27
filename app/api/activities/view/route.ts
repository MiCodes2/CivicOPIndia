import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Server enforces a per-visitor/per-user 1-hour throttle for counting views.
const THROTTLE_MS = 1000 * 60 * 60; // 1 hour

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.activityId;
    const visitorId = body?.visitorId ?? null;
    const userId = body?.userId ?? null;
    if (!id) return NextResponse.json({ error: 'Missing activityId' }, { status: 400 });

    const supabase = await createServerClient();

    // Find the most recent view by this visitor or user
    let lastView: any = null;
    if (userId) {
      const { data: lv } = await supabase.from('activity_views').select('created_at').eq('activity_id', id).eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      lastView = lv;
    }
    if (!lastView && visitorId) {
      const { data: lv } = await supabase.from('activity_views').select('created_at').eq('activity_id', id).eq('visitor_id', visitorId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      lastView = lv;
    }

    const now = new Date();
    if (lastView) {
      const last = new Date(lastView.created_at).getTime();
      if (now.getTime() - last < THROTTLE_MS) {
        // throttle: do not count again
        const { data: existing } = await supabase.from('activities').select('views_count').eq('id', id).maybeSingle();
        return NextResponse.json({ views_count: existing?.views_count ?? 0, counted: false });
      }
    }

    // Insert a view row and increment the counter
    const { error: insertErr } = await supabase.from('activity_views').insert([{ activity_id: id, visitor_id: visitorId, user_id: userId }]);
    if (insertErr) return NextResponse.json({ error: insertErr }, { status: 500 });

    const { data, error } = await supabase.from('activities').update({ views_count: (supabase.raw ? supabase.raw('COALESCE(views_count,0) + 1') : undefined) }).eq('id', id).select('views_count').maybeSingle();
    // Note: the above update might not support raw SQL in all clients; fall back to fetching and incrementing
    if (error || !data) {
      // fallback: read current and write cur+1
      const { data: existing } = await supabase.from('activities').select('views_count').eq('id', id).maybeSingle();
      const cur = (existing?.views_count ?? 0) as number;
      const { data: d2, error: e2 } = await supabase.from('activities').update({ views_count: cur + 1 }).eq('id', id).select('views_count').maybeSingle();
      if (e2) return NextResponse.json({ error: e2 }, { status: 500 });
      return NextResponse.json({ views_count: d2?.views_count ?? cur + 1, counted: true });
    }

    return NextResponse.json({ views_count: data?.views_count ?? 0, counted: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

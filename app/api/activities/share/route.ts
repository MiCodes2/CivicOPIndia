import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Server enforces a per-visitor/per-user 24-hour throttle for counting shares.
const THROTTLE_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.activityId;
    const visitorId = body?.visitorId || null;
    if (!id) return NextResponse.json({ error: 'Missing activityId' }, { status: 400 });

    const supabase = await createServerClient();

    // Try to get authenticated user (if any)
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch (e) {
      userId = null;
    }

    // Find the most recent share by this visitor or user
    let lastShare: any = null;
    if (userId) {
      const { data: ls } = await supabase.from('activity_shares').select('created_at').eq('activity_id', id).eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      lastShare = ls;
    }
    if (!lastShare && visitorId) {
      const { data: ls } = await supabase.from('activity_shares').select('created_at').eq('activity_id', id).eq('visitor_id', visitorId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      lastShare = ls;
    }

    const now = new Date();
    if (lastShare) {
      const last = new Date(lastShare.created_at).getTime();
      if (now.getTime() - last < THROTTLE_MS) {
        // throttle: do not count again, but return current count
        const { data: existing } = await supabase.from('activities').select('shares_count').eq('id', id).maybeSingle();
        return NextResponse.json({ shares_count: existing?.shares_count ?? 0, counted: false });
      }
    }

    // Fetch current value
    const { data: existing } = await supabase.from('activities').select('shares_count').eq('id', id).maybeSingle();
    const cur = (existing?.shares_count ?? 0) as number;

    // Increment aggregate count and also log a per-share row for metrics
    const updates = { shares_count: cur + 1 };
    const { data, error } = await supabase.from('activities').update(updates).eq('id', id).select('shares_count').maybeSingle();
    if (error) return NextResponse.json({ error }, { status: 500 });

    // Best-effort insert into activity_shares (non-blocking if it fails)
    try {
      await supabase.from('activity_shares').insert([{ activity_id: id, visitor_id: visitorId, user_id: userId }]);
    } catch (e) {
      // swallow: metric logging should not break UX
      console.warn('Failed to log share event:', e);
    }

    return NextResponse.json({ shares_count: data?.shares_count ?? cur + 1, counted: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
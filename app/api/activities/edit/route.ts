import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch activity and ensure user is the author
    const { data: activity } = await supabase.from('activities').select('id,author_id').eq('id', id).maybeSingle();
    if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    if (String(activity.author_id) !== String(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Allowed fields to update
    const allowedFields = ['title','content','location','image_url','image_urls','tags','activity_date'];
    const updates: any = {};
    for (const f of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, f)) updates[f] = body[f];
    }

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    // Normalize activity_date
    if (updates.activity_date) {
      try { updates.activity_date = new Date(updates.activity_date).toISOString(); } catch {}
    }

    const { data: updated, error } = await supabase.from('activities').update(updates).eq('id', id).select('*').maybeSingle();
    if (error) return NextResponse.json({ error: error.message || error }, { status: 500 });

    return NextResponse.json({ ok: true, activity: updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
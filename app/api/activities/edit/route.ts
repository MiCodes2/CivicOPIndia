import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = await createServerClient();

    // Try server-side session first (cookie-based)
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch (e) {
      userId = null;
    }

    // If no server cookie session, accept an access token in the Authorization header
    let debugInfo: any = {};
    if (!userId) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      debugInfo.authHeaderPresent = Boolean(authHeader);
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const apikey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
          debugInfo.authApikeySent = Boolean(apikey);
          const urlBase = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const resp = await fetch(urlBase + '/auth/v1/user', {
            headers: { Authorization: `Bearer ${token}`, ...(apikey ? { apikey } : {}) },
          });
          debugInfo.authCheckStatus = resp.status;
          debugInfo.authCheckOk = resp.ok;
          try { debugInfo.authCheckBody = await resp.json(); } catch { debugInfo.authCheckBody = null; }
          if (resp.ok) {
            const data = debugInfo.authCheckBody;
            userId = data?.id ?? null;
          }
        } catch (e) {
          debugInfo.authCheckError = String(e);
          userId = null;
        }
      }
    }

    if (!userId) {
      const payload: any = { error: 'Unauthorized' };
      // Only include helpful debug hints in non-production environments
      if (process.env.NODE_ENV !== 'production') payload.debug = debugInfo;
      return NextResponse.json(payload, { status: 401 });
    }

    // Fetch activity and ensure user is the author
    const { data: activity } = await supabase.from('activities').select('id,author_id').eq('id', id).maybeSingle();
    if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    if (String(activity.author_id) !== String(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
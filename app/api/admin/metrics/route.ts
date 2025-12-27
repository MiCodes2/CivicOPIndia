import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

function toIsoDate(d: Date) {
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const days = Math.max(1, Math.min(365, Number(url.searchParams.get('days') || '30')));

    const supabase = await createServerClient();

    // Protect: prefer server cookie session but accept Bearer token fallback
    let userId: string | null = null;
    let debug: any = { cookieUser: null, authHeaderPresent: false, authCheckStatus: null, authCheckBody: null };
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      debug.cookieUser = !!userId;
    } catch (e) {
      userId = null;
      debug.cookieUser = false;
    }

    if (!userId) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      debug.authHeaderPresent = Boolean(authHeader);
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const apikey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
          debug.authApikeySent = Boolean(apikey);
          const urlBase = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const resp = await fetch(urlBase + '/auth/v1/user', { headers: { Authorization: `Bearer ${token}`, ...(apikey ? { apikey } : {}) } });
          debug.authCheckStatus = resp.status;
          try { debug.authCheckBody = await resp.json(); } catch { debug.authCheckBody = null; }
          if (resp.ok) {
            const data = debug.authCheckBody;
            userId = data?.id ?? null;
          }
        } catch (e) {
          debug.authCheckError = String(e);
          userId = null;
        }
      }
    }

    if (!userId) {
      const payload: any = { error: 'Unauthorized' };
      if (process.env.NODE_ENV !== 'production') payload.debug = debug;
      return NextResponse.json(payload, { status: 401 });
    }

    const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
    const sinceIso = since.toISOString();

    // For portability use simple selects and aggregate in JS to avoid PostgREST grouping limitations
    const { data: viewsData, error: vErr } = await supabase.from('activity_views').select('created_at').gte('created_at', sinceIso).order('created_at', { ascending: true }).limit(100000);
    if (vErr) throw vErr;
    const { data: likesData, error: lErr } = await supabase.from('activity_likes').select('created_at').gte('created_at', sinceIso).order('created_at', { ascending: true }).limit(100000);
    if (lErr) throw lErr;

    let sharesData: any[] = [];
    try {
      const { data: sData, error: sErr } = await supabase.from('activity_shares').select('created_at').gte('created_at', sinceIso).order('created_at', { ascending: true }).limit(100000);
      if (!sErr && sData) sharesData = sData;
    } catch (e) {
      sharesData = [];
    }

    const toDay = (d: string) => (new Date(d).toISOString().slice(0,10));
    const countByDay = (rows: any[]) => {
      const m: Record<string, number> = {};
      (rows || []).forEach(r => {
        const day = toDay(r.created_at);
        m[day] = (m[day] || 0) + 1;
      });
      return m;
    };

    const viewsCounts = countByDay(viewsData || []);
    const likesCounts = countByDay(likesData || []);
    const sharesCounts = countByDay(sharesData || []);

    // Build date array and map counts
    const daysArr: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      daysArr.push(toIsoDate(d));
    }

    const mapCountsFromMap = (m: Record<string, number>) => daysArr.map(d => m[d] || 0);

    let viewsSeries = mapCountsFromMap(viewsCounts);
    let likesSeries = mapCountsFromMap(likesCounts);
    let sharesSeries = mapCountsFromMap(sharesCounts);

    // Fallback: if likes/shares event tables are empty, derive series from activities' aggregated counts
    const sum = (arr: number[]) => arr.reduce((a,b)=>a+b, 0);
    if (sum(likesSeries) === 0 || sum(sharesSeries) === 0) {
      try {
        const { data: acts, error: aErr } = await supabase.from('activities').select('created_at, likes_count, shares_count');
        if (!aErr && acts) {
          const actLikes: Record<string, number> = {};
          const actShares: Record<string, number> = {};
          for (const a of acts) {
            const day = (new Date(a.created_at)).toISOString().slice(0,10);
            actLikes[day] = (actLikes[day] || 0) + Number(a.likes_count || 0);
            actShares[day] = (actShares[day] || 0) + Number(a.shares_count || 0);
          }
          if (sum(likesSeries) === 0) likesSeries = daysArr.map(d => actLikes[d] || 0);
          if (sum(sharesSeries) === 0) sharesSeries = daysArr.map(d => actShares[d] || 0);
        }
      } catch (e) {
        // ignore fallback errors
      }
    }

    return NextResponse.json({ days: daysArr, series: { views: viewsSeries, likes: likesSeries, shares: sharesSeries } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

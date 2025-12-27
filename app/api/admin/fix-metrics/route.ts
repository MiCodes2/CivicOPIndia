import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

const HEADER = 'x-admin-secret';

export async function POST(req: Request) {
  const secret = req.headers.get(HEADER);
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServerClient();

    const { data: rows, error } = await supabase.from('activities').select('id, title, likes_count, shares_count, views_count').order('id');
    if (error) return NextResponse.json({ error }, { status: 500 });

    const changes: any[] = [];

    for (const r of rows || []) {
      const likes = r.likes_count || 0;
      const shares = r.shares_count || 0;
      const views = r.views_count || 0;

      let newShares = shares;
      let newViews = views;
      let changed = false;

      // shares must not exceed likes, and should be <= 15% of likes
      const maxByPct = Math.ceil(likes * 0.15);
      const capShares = Math.min(likes, maxByPct || likes);
      if (shares > capShares) {
        newShares = Math.min(capShares, likes);
        changed = true;
      }

      // views should be at least likes
      if (likes > views) {
        newViews = likes;
        changed = true;
      }

      if (changed) {
        const updates: any = {};
        if (newShares !== shares) updates.shares_count = newShares;
        if (newViews !== views) updates.views_count = newViews;
        const { error: uerr } = await supabase.from('activities').update(updates).eq('id', r.id);
        if (!uerr) {
          changes.push({ id: r.id, title: r.title, old: { likes, shares, views }, updates });
        }
      }
    }

    return NextResponse.json({ fixed: changes.length, changes });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
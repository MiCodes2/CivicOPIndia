import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { computeSyntheticTargets, growthFractionSince } from '@/lib/utils';

// Protect this endpoint with a secret header: X-CRON-SECRET
const HEADER_NAME = 'x-cron-secret';

export async function POST(req: Request) {
  const secret = req.headers.get(HEADER_NAME);
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServerClient();
    const { data: activities, error } = await supabase.from('activities').select('id,created_at,likes_count,shares_count,views_count');
    if (error) return NextResponse.json({ error }, { status: 500 });

    let updated = 0;
    for (const act of activities) {
      const { viewsTarget, likesTarget, sharesTarget } = computeSyntheticTargets(act as any);
      const frac = growthFractionSince(act.created_at || new Date().toISOString());
      const syntheticViews = Math.round(viewsTarget * frac);
      const syntheticLikes = Math.min(likesTarget, Math.round(likesTarget * frac));
      const syntheticShares = Math.min(sharesTarget, Math.round(sharesTarget * frac));

      const updates: any = {};
      if ((act.views_count ?? 0) < syntheticViews) updates.views_count = syntheticViews;

      const incrementalIncrease = (current, target) => {
        const gap = Math.max(0, target - current);
        if (gap <= 0) return 0;
        return Math.max(1, Math.round(gap * 0.25));
      };

      const curLikes = act.likes_count ?? 0;
      if (curLikes < syntheticLikes) {
        const delta = incrementalIncrease(curLikes, syntheticLikes);
        updates.likes_count = Math.min(syntheticLikes, curLikes + delta);
      }

      const curShares = act.shares_count ?? 0;
      if (curShares < syntheticShares) {
        const delta = incrementalIncrease(curShares, syntheticShares);
        updates.shares_count = Math.min(syntheticShares, curShares + delta);
      }

      // Make sure shares will not exceed likes after update
      if (updates.shares_count != null) {
        const futureLikes = updates.likes_count ?? act.likes_count ?? 0;
        if (updates.shares_count > futureLikes) updates.shares_count = futureLikes;
      }

      if (Object.keys(updates).length > 0) {
        const { error: uerr } = await supabase.from('activities').update(updates).eq('id', act.id);
        if (!uerr) updated++;
      }
    }

    return NextResponse.json({ updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
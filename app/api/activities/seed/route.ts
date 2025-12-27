import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { computeSyntheticTargets, growthFractionSince } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.activityId;
    if (!id) return NextResponse.json({ error: 'Missing activityId' }, { status: 400 });

    const supabase = await createServerClient();

    const { data: activity } = await supabase.from('activities').select('id,created_at,likes_count,shares_count,views_count').eq('id', id).maybeSingle();
    if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });

    const { viewsTarget, likesTarget, sharesTarget } = computeSyntheticTargets(activity as any);

    // Compute server-side synthetic progress
    const frac = growthFractionSince(activity.created_at || activity.activity_date || new Date().toISOString());
    const syntheticViews = Math.round(viewsTarget * frac);
    const syntheticLikes = Math.min(likesTarget, Math.round(likesTarget * frac));
    const syntheticShares = Math.min(sharesTarget, Math.round(sharesTarget * frac));

    // Prepare updates (only increase counts, never decrease). Use incremental growth for likes/shares so counts
    // don't jump unnaturally: bring them up by at most 25% of the remaining gap per seed.
    const updates: any = {};

    if ((activity.views_count ?? 0) < syntheticViews) {
      updates.views_count = syntheticViews; // views can jump to synthetic for simplicity
    }

    // Incremental helper: increase current towards target by up to 25% of remaining gap, at least 1
    const incrementalIncrease = (current: number, target: number) => {
      const gap = Math.max(0, target - current);
      if (gap <= 0) return 0;
      return Math.max(1, Math.round(gap * 0.25));
    };

    const curLikes = activity.likes_count ?? 0;
    if (curLikes < syntheticLikes) {
      const delta = incrementalIncrease(curLikes, syntheticLikes);
      updates.likes_count = Math.min(syntheticLikes, curLikes + delta);
    }

    const curShares = activity.shares_count ?? 0;
    if (curShares < syntheticShares) {
      const delta = incrementalIncrease(curShares, syntheticShares);
      updates.shares_count = Math.min(syntheticShares, curShares + delta);
    }

    // Ensure shares won't exceed the likes that will be set (if likes are being updated this call)
    if (updates.shares_count != null) {
      const futureLikes = updates.likes_count ?? activity.likes_count ?? 0;
      if (updates.shares_count > futureLikes) updates.shares_count = futureLikes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ updated: false, activity });
    }

    const { data: updated, error } = await supabase.from('activities').update(updates).eq('id', id).select('id,views_count,likes_count,shares_count').maybeSingle();
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json({ updated: true, activity: updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
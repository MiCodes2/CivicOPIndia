import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { computeSyntheticTargets, growthFractionToReach } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.activityId;
    if (!id) return NextResponse.json({ error: 'Missing activityId' }, { status: 400 });

    const supabase = await createServerClient();

    const { data: activity } = await supabase.from('activities').select('id,created_at,likes_count,shares_count,views_count,initial_likes_count,initial_shares_count,initial_views_count').eq('id', id).maybeSingle();
    if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });

    const { viewsTarget, likesTarget, sharesTarget } = computeSyntheticTargets(activity as any);

    // Compute server-side synthetic progress
    const createdAt = (activity as any).created_at || new Date().toISOString();

    // Views: if there's an initial_views_count, reach that in ~3 days then slowly grow to final target over 30 days
    const initialViews = activity.initial_views_count || Math.round((activity.initial_likes_count || 0) * 100);
    let syntheticViews;
    if (initialViews > 0) {
      const baseFracV = growthFractionToReach(createdAt, 3);
      const extraFracV = growthFractionToReach(createdAt, 30);
      const basePartV = Math.round(initialViews * baseFracV);
      const extraPartV = Math.round(Math.max(0, viewsTarget - initialViews) * extraFracV);
      syntheticViews = Math.min(viewsTarget, basePartV + extraPartV);
    } else {
      syntheticViews = Math.round(viewsTarget * growthFractionToReach(createdAt, 30));
    }

    // Likes: reach initial in ~3 days, then slowly grow to final target (final target is computed by computeSyntheticTargets and will respect 2x default multiplier)
    const initialLikes = activity.initial_likes_count || 0;
    let syntheticLikes;
    if (initialLikes > 0) {
      const baseFrac = growthFractionToReach(createdAt, 3);
      const extraFrac = growthFractionToReach(createdAt, 30);
      const basePart = Math.round(initialLikes * baseFrac);
      const extraPart = Math.round(Math.max(0, likesTarget - initialLikes) * extraFrac);
      syntheticLikes = Math.min(likesTarget, basePart + extraPart);
    } else {
      syntheticLikes = Math.min(likesTarget, Math.round(likesTarget * growthFractionToReach(createdAt, 30)));
    }

    // Shares: similarly respect initial shares if present and grow slowly
    const initialShares = activity.initial_shares_count || 0;
    let syntheticShares;
    if (initialShares > 0) {
      const baseFracS = growthFractionToReach(createdAt, 3);
      const extraFracS = growthFractionToReach(createdAt, 30);
      const basePartS = Math.round(initialShares * baseFracS);
      const extraPartS = Math.round(Math.max(0, sharesTarget - initialShares) * extraFracS);
      syntheticShares = Math.min(sharesTarget, basePartS + extraPartS);
    } else {
      syntheticShares = Math.min(sharesTarget, Math.round(sharesTarget * growthFractionToReach(createdAt, 30)));
    }

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
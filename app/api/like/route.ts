import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { activityId } = await request.json();
    
    // Get IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const supabase = await createClient();

    // Try to get authenticated user (if any)
    let userId: string | null = null;
    try {
      // supabase server client exposes auth.getUser()
      // @ts-ignore
      const userRes = await supabase.auth.getUser();
      // @ts-ignore
      userId = userRes?.data?.user?.id || null;
    } catch (e) {
      userId = null;
    }

    // Check if user already liked this activity
    // Determine existing like by user id (preferred) or by ip fallback
    let existingLikeQuery = supabase
      .from('activity_likes')
      .select('id')
      .eq('activity_id', activityId);

    if (userId) {
      existingLikeQuery = existingLikeQuery.eq('user_id', userId);
    } else {
      existingLikeQuery = existingLikeQuery.eq('ip_address', ip);
    }

    const { data: existingLike } = await existingLikeQuery.single();

    if (existingLike) {
      // Unlike - remove the like
      await supabase
        .from('activity_likes')
        .delete()
        .eq('id', existingLike.id);

      // Decrement likes_count
      const { data: activity } = await supabase
        .from('activities')
        .select('likes_count')
        .eq('id', activityId)
        .single();

      if (activity) {
        await supabase
          .from('activities')
          .update({ likes_count: Math.max(0, activity.likes_count - 1) })
          .eq('id', activityId);
      }

      return NextResponse.json({ 
        liked: false,
        message: 'Like removed'
      });
    } else {
      // Add like
      // Insert like record, include user_id when available
      await supabase
        .from('activity_likes')
        .insert([{
          activity_id: activityId,
          ip_address: ip,
          user_agent: userAgent,
          user_id: userId,
        }]);

      // Increment likes_count
      const { data: activity } = await supabase
        .from('activities')
        .select('likes_count')
        .eq('id', activityId)
        .single();

      if (activity) {
        await supabase
          .from('activities')
          .update({ likes_count: activity.likes_count + 1 })
          .eq('id', activityId);
      }

      return NextResponse.json({ 
        liked: true,
        message: 'Like added'
      });
    }
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json(
      { error: 'Failed to process like' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activityId = searchParams.get('activityId');
    
    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const supabase = await createClient();

    // Try to get authenticated user id
    let userId: string | null = null;
    try {
      // @ts-ignore
      const userRes = await supabase.auth.getUser();
      // @ts-ignore
      userId = userRes?.data?.user?.id || null;
    } catch (e) {
      userId = null;
    }

    let existingLikeQuery = supabase
      .from('activity_likes')
      .select('id')
      .eq('activity_id', activityId);

    if (userId) {
      existingLikeQuery = existingLikeQuery.eq('user_id', userId);
    } else {
      existingLikeQuery = existingLikeQuery.eq('ip_address', ip);
    }

    const { data: existingLike } = await existingLikeQuery.single();

    return NextResponse.json({
      liked: !!existingLike,
    });
  } catch (error) {
    return NextResponse.json({ liked: false });
  }
}

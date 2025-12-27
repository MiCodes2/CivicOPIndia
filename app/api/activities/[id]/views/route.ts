import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, context: { params: any }) {
  try {
    const p = await context.params;
    const activityId = Number(p?.id);
    if (!activityId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = await createServerClient();
    const { data, error } = await supabase.from('activity_views').select('id, visitor_id, user_id, created_at').eq('activity_id', activityId).order('created_at', { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ rows: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin(supabase:any) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = (userData as any)?.user;
    if (!user?.id) return false;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile && (profile as any).role === 'admin') return true;
    return false;
  } catch (e) {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const isAdmin = await requireAdmin(supabase);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('search_stopwords').select('*').order('word');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ stopwords: data || [] });
  } catch (err:any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const word = (payload?.word || '').trim();
    if (!word) return NextResponse.json({ error: 'word required' }, { status: 400 });

    const supabase = await createClient();
    const isAdmin = await requireAdmin(supabase);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('search_stopwords').insert([{ word }]).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inserted: data });
  } catch (err:any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = await createClient();
    const isAdmin = await requireAdmin(supabase);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('search_stopwords').delete().eq('id', id).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: data });
  } catch (err:any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

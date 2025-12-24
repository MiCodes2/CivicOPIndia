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

    const { data, error } = await supabase.from('search_synonyms').select('*').order('id', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ synonyms: data || [] });
  } catch (err:any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const term = (payload?.term || '').trim();
    const canonical = (payload?.canonical || '').trim();
    if (!term || !canonical) return NextResponse.json({ error: 'term and canonical are required' }, { status: 400 });

    const supabase = await createClient();
    const isAdmin = await requireAdmin(supabase);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('search_synonyms').insert([{ term, canonical }]).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inserted: data });
  } catch (err:any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const payload = await req.json();
    const id = payload?.id;
    const term = (payload?.term || '').trim();
    const canonical = (payload?.canonical || '').trim();
    if (!id || !term || !canonical) return NextResponse.json({ error: 'id, term and canonical are required' }, { status: 400 });

    const supabase = await createClient();
    const isAdmin = await requireAdmin(supabase);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('search_synonyms').update({ term, canonical }).eq('id', id).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: data });
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

    const { data, error } = await supabase.from('search_synonyms').delete().eq('id', id).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: data });
  } catch (err:any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

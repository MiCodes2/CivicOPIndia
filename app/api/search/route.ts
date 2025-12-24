import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') || null;
    const tag = url.searchParams.get('tag') || null;
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '10', 10) || 10, 100);
    const offset = (page - 1) * perPage;

    const supabase = await createClient();

    const { data: results, error: resultsError } = await supabase.rpc('search_activities', { in_query: q, in_type: type, in_tag: tag, in_limit: perPage, in_offset: offset }) as any;
    if (resultsError) {
      return NextResponse.json({ error: resultsError.message }, { status: 500 });
    }

    // Count
    const { data: countRes, error: countError } = await supabase.rpc('search_activities_count', { in_query: q, in_type: type, in_tag: tag }) as any;
    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const total = Array.isArray(countRes) ? (countRes[0] as any).search_activities_count : countRes;
    const parsedTotal = typeof total === 'number' ? total : (countRes && countRes[0] ? (countRes[0] as any).count : 0);

    // Facets (types, tags)
    const { data: facetsRes, error: facetsError } = await supabase.rpc('search_facets', { in_query: q, in_type: type, in_tag: tag }) as any;
    if (facetsError) {
      return NextResponse.json({ error: facetsError.message }, { status: 500 });
    }

    // RPC returns JSONB (may be wrapped); normalize
    const facets = facetsRes && facetsRes.length ? facetsRes[0] : facetsRes || { types: [], tags: [] };

    // Fallback: if no results and a query is present, try trigram fuzzy search
    let finalResults = results || [];
    let fallback = false;
    if ((finalResults.length === 0 || !finalResults) && q && q.trim()) {
      try {
        const { data: trigramRes, error: trigramErr } = await supabase.rpc('search_trigram', { in_query: q, in_limit: perPage, in_offset: offset }) as any;
        if (!trigramErr && (trigramRes || []).length > 0) {
          finalResults = trigramRes;
          fallback = true;
        }
      } catch (e) {
        // ignore trigram fallback errors — we keep returning primary search errors earlier
      }
    }

    const response = { results: finalResults || [], total: parsedTotal, page, perPage, facets, fallback };

    // Cache small TTL at CDN/edge to reduce repeated identical queries
    const headers = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' };

    return NextResponse.json(response, { status: 200, headers });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

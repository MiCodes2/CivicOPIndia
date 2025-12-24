import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple in-memory cache and rudimentary rate limiter (per-process)
const CACHE = new Map<string, { ts: number; data: any }>()
const CACHE_TTL = 30 * 1000 // 30s

const RATE = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 60 // 60 seconds window
const RATE_MAX = 30 // max requests per window per IP

function getIp(req: Request) {
  try {
    const url = new URL(req.url)
    return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || url.hostname || 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').trim()
    if (!q) return NextResponse.json({ results: [] })

    // rate limit per IP
    const ip = getIp(req)
    const now = Date.now()
    const st = RATE.get(ip) || { count: 0, reset: now + RATE_LIMIT * 1000 }
    if (now > st.reset) {
      st.count = 0
      st.reset = now + RATE_LIMIT * 1000
    }
    st.count += 1
    RATE.set(ip, st)
    if (st.count > RATE_MAX) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // cache
    const key = `q:${q}`
    const cached = CACHE.get(key)
    if (cached && now - cached.ts < CACHE_TTL) {
      return NextResponse.json({ results: cached.data })
    }

    const supabase = await createClient()

    // Try RPC full-text search (requires migration). Fallback to ilike when RPC fails.
    let results: any[] = []

    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('search_activities', { query_text: q, limit_rows: 200 })
      if (rpcErr) throw rpcErr
      results = rpcData || []
    } catch (rpcFail) {
      // Fallback to ilike search
      const ilikeQ = `%${q.replace(/%/g, '\%')}%`
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .or(`title.ilike.${ilikeQ},content.ilike.${ilikeQ}`)
        .limit(500)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      results = (data || []).map((row: any) => {
        let score = 0
        const lc = q.toLowerCase()
        if (row.title && String(row.title).toLowerCase().includes(lc)) score += 3
        if (Array.isArray(row.tags) && row.tags.some((t: string) => String(t).toLowerCase().includes(lc))) score += 2
        if (row.content && String(row.content).toLowerCase().includes(lc)) score += 1
        score += (row.likes_count || 0) * 0.01
        return { ...row, _score: score }
      })
      results.sort((a: any, b: any) => (b._score || 0) - (a._score || 0))
    }

    CACHE.set(key, { ts: now, data: results })
    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

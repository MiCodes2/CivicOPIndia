import { NextResponse } from 'next/server'
import { Client } from 'twitter-api-sdk'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Simple in-memory cache (works for dev and single-host deployments).
// TTL in ms
const CACHE_TTL = Number(process.env.X_FOLLOWERS_CACHE_TTL_MS || 10 * 60 * 1000)
let cached: { value: string | null; expiresAt: number } | null = null

export async function GET() {
  try {
    const handle = process.env.NEXT_PUBLIC_X_HANDLE || process.env.X_HANDLE || 'CivicOp_india'

    // First, try to return latest stored value from DB (so UI is never blank)
    try {
      const supabase = await createServerClient()
      const { data: latest, error: dbErr } = await supabase.from('social_followers').select('followers_count,fetched_at').eq('platform', 'x').eq('handle', handle).order('fetched_at', { ascending: false }).limit(1).maybeSingle()
      if (!dbErr && latest && typeof latest.followers_count === 'number') {
        const formatted = Number(latest.followers_count).toLocaleString('en-IN')
        // Cache the DB value briefly
        cached = { value: formatted, expiresAt: Date.now() + Math.min(CACHE_TTL, 60 * 60 * 1000) }
        return NextResponse.json({ followers: formatted, cached: 'db', fetched_at: latest.fetched_at })
      }
    } catch (dbErr) {
      // Ignore DB errors here and fall back to live fetch below; log for diagnostics
      console.warn('Failed to read stored follower count:', dbErr)
    }

    // Return cached value when valid
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json({ followers: cached.value, cached: true })
    }

    const token = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN || process.env.BEARER_TOKEN
    if (!token) {
      return NextResponse.json({ followers: null, error: 'missing_token' }, { status: 400 })
    }

    const client = new Client(token)

    // Use the SDK to fetch user public metrics
    const resp = await client.users.findUserByUsername(handle, { 'user.fields': ['public_metrics'] })
    const count = resp?.data?.public_metrics?.followers_count
    if (typeof count === 'number') {
      const formatted = Number(count).toLocaleString('en-IN')
      cached = { value: formatted, expiresAt: Date.now() + CACHE_TTL }
      return NextResponse.json({ followers: formatted })
    }

    // If we didn't get a number, fall through to fallback handling below
    throw new Error('no_followers_in_response')
  } catch (err: any) {
    console.error('Error fetching X followers:', err)

    const fallback = process.env.NEXT_PUBLIC_X_FOLLOWERS_FALLBACK || null
    // If rate limited or any other error, serve fallback if available and cache it briefly
    if (fallback) {
      const fallbackTTL = Number(process.env.X_FOLLOWERS_FALLBACK_TTL_MS || 5 * 60 * 1000)
      cached = { value: String(fallback), expiresAt: Date.now() + fallbackTTL }
      const status = err?.status === 429 ? 200 : 200
      const reason = err?.status === 429 ? 'rate_limited' : 'error'
      return NextResponse.json({ followers: String(fallback), fallback: true, reason }, { status })
    }

    const status = err?.status || 500
    return NextResponse.json({ followers: null, error: String(err) }, { status })
  }
}

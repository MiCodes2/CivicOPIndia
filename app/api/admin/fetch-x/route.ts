import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const secret = req.headers.get('x-cron-secret') || req.headers.get('X-Cron-Secret')
    if (!secret || secret !== process.env.X_CRON_SECRET) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const handle = process.env.NEXT_PUBLIC_X_HANDLE || process.env.X_HANDLE || 'CivicOp_india'
    const token = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN || process.env.BEARER_TOKEN
    if (!token) return NextResponse.json({ error: 'missing_x_token' }, { status: 500 })

    const url = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=public_metrics`
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      const txt = await resp.text().catch(() => null)
      return NextResponse.json({ error: `x_api_error_${resp.status}`, body: txt }, { status: 500 })
    }

    const data = await resp.json()
    const count = Number(data?.data?.public_metrics?.followers_count || 0)

    const supabase = await createServerClient()
    const { data: inserted, error } = await supabase.from('social_followers').insert([{ platform: 'x', handle, followers_count: count }]).select('*').maybeSingle()
    if (error) return NextResponse.json({ error: error.message || error }, { status: 500 })

    return NextResponse.json({ ok: true, inserted })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

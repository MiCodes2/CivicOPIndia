import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple in-process cache for trending (short TTL)
const TREND_CACHE: { ts: number; data: any } | null = null as any
let TREND_STORE: { ts: number; data: any } | null = null
const TREND_TTL = 30 * 1000 // 30s

export async function GET() {
  try {
    const now = Date.now()
    if (TREND_STORE && now - TREND_STORE.ts < TREND_TTL) {
      return NextResponse.json({ trending: TREND_STORE.data })
    }

    const supabase = await createClient()

    // Pull recent activities with tags (last 30 days)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)

    const { data, error } = await supabase
      .from('activities')
      .select('tags')
      .gte('activity_date', cutoff.toISOString())
      .limit(1000)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const counts: Record<string, number> = {}
    ;(data || []).forEach((r: any) => {
      if (!Array.isArray(r.tags)) return
      r.tags.forEach((t: string) => {
        const tag = String(t).toLowerCase()
        if (!tag) return
        counts[tag] = (counts[tag] || 0) + 1
      })
    })

    const trending = Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    TREND_STORE = { ts: now, data: trending }

    return NextResponse.json({ trending })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

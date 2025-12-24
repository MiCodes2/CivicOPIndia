import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').trim()
    if (!q) return NextResponse.json({ results: [] })

    const supabase = await createClient()

    // Fetch candidate rows matching title, content or tags (case-insensitive)
    const ilikeQ = `%${q.replace(/%/g, '\%')}%`

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .or(`title.ilike.${ilikeQ},content.ilike.${ilikeQ}`)
      .limit(500)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const results = (data || []).map((row: any) => {
      let score = 0
      const lc = q.toLowerCase()
      if (row.title && String(row.title).toLowerCase().includes(lc)) score += 3
      if (Array.isArray(row.tags) && row.tags.some((t: string) => String(t).toLowerCase().includes(lc))) score += 2
      if (row.content && String(row.content).toLowerCase().includes(lc)) score += 1
      // boost by likes
      score += (row.likes_count || 0) * 0.01
      return { ...row, _score: score }
    })

    results.sort((a: any, b: any) => b._score - a._score)

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

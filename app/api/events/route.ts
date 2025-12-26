import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    // Fetch upcoming events from the dedicated `events` table
    const { data, error } = await supabase
      .from('events')
      .select('id,title,event_date,type,location,image_url,content')
      .eq('published', true)
      .order('event_date', { ascending: false })
      .limit(4)

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ events: [] })
    }

    return NextResponse.json({ events: data || [] })
  } catch (err) {
    console.error('Unexpected error in events route:', err)
    return NextResponse.json({ events: [] }, { status: 500 })
  }
}

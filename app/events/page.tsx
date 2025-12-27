import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { decodeHtmlEntities } from '@/lib/formatContent'

export const metadata = { title: 'Events' }

export default async function EventsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('id,title,event_date,type,location,image_url,content')
    .eq('published', true)
    .order('event_date', { ascending: false })

  const events = data || []

  return (
    <div className="mt-6 pb-12">
      <div className="container mx-auto px-3">
        <h1 className="text-2xl font-bold">Events</h1>
        {events.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">No events found.</div>
        ) : (
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(ev => (
              <Card key={ev.id} className="flex flex-col text-sm py-1 gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {ev.image_url && (
                  <img src={ev.image_url} alt={decodeHtmlEntities(ev.title)} className="h-24 w-full object-cover rounded-t-md" />
                )}
                <CardContent className="px-3 py-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2 mb-0">{decodeHtmlEntities(ev.title)}</CardTitle>
                    <div className="text-xs text-muted-foreground">{ev.type}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(ev.event_date ?? '').toLocaleDateString()}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{ev.location}</div>
                  <div className="mt-2"><Link href={`/events/${ev.id}`} className="text-primary underline">View Details</Link></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

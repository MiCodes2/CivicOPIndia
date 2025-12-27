import { createClient } from '@/lib/supabase/server'
import { pageMetadata } from '@/lib/pageMetadata'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatContent, decodeHtmlEntities } from '@/lib/formatContent'
import EventImage from '@/components/EventImage'

type Props = { params: { id: string } }

export default async function EventPage({ params }: Props) {
  const supabase = await createClient()
  const resolvedParams = await params as any
  const id = Number(resolvedParams.id)
  if (Number.isNaN(id)) return notFound()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('Event fetch error:', error)
    return notFound()
  }

  const event = data as any

  return (
    <div className="container mx-auto px-4 pt-8 pb-20">
      <div className="max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl font-bold">{decodeHtmlEntities(event.title)}</h1>

        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          <Link href="/" className="text-primary underline">Home</Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/events" className="text-primary underline">Events</Link>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">{new Date(event.event_date).toLocaleString()}</div>
        {event.location && <div className="mt-1 text-sm text-muted-foreground">{event.location}</div>}
        {event.image_url && (
          <EventImage images={[event.image_url]} alt={decodeHtmlEntities(event.title)} />
        )}
        <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: formatContent(event.content || '') }} />
      </div>
      <div className="h-20 md:h-28" />
    </div>
  )
}

export const metadata = pageMetadata.home

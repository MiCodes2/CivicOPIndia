import { createClient } from '@/lib/supabase/server'
import { pageMetadata } from '@/lib/pageMetadata'
import { notFound } from 'next/navigation'

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <div className="mt-2 text-sm text-muted-foreground">{new Date(event.event_date).toLocaleString()}</div>
        {event.location && <div className="mt-1 text-sm text-muted-foreground">{event.location}</div>}
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image_url} alt={event.title} className="mt-4 w-full rounded-md object-cover" />
        )}
        <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: event.content || '' }} />
      </div>
    </div>
  )
}

export const metadata = pageMetadata.home

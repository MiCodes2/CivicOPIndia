"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { decodeHtmlEntities } from '@/lib/formatContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface EventItem {
  id: number;
  title: string;
  activity_date?: string;
  event_date?: string;
  type?: string;
  location?: string;
  image_url?: string;
  content?: string;
}

export default function EventsList() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/events');
        const json = await res.json();
        if (mounted) setEvents(json.events || []);
      } catch (e) {
        console.warn('Failed to load events', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  if (loading) return <div className="mt-4">Loading events...</div>
  if (!events || events.length === 0) return <div className="mt-4 text-sm text-muted-foreground">No upcoming events</div>

  const excerpt = (html?: string, n = 140) => {
    if (!html) return '';
    // naive HTML tag stripper
    const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > n ? text.slice(0, n).trim() + '…' : text;
  }

  const sortedEvents = [...events].sort((a,b) => new Date(b.event_date ?? b.activity_date ?? '').getTime() - new Date(a.event_date ?? a.activity_date ?? '').getTime());

  return (
    <div className="mt-6 mb-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {sortedEvents.map(ev => (
          <Card key={ev.id} className="flex flex-col text-sm py-1 gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {ev.image_url && (
              <img src={ev.image_url} alt={ev.title} className="h-14 w-full object-cover rounded-t-md" />
            )}
            <CardContent className="px-3 py-1">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base line-clamp-2 mb-0">{decodeHtmlEntities(ev.title)}</CardTitle>
                <div className="text-xs text-muted-foreground">{ev.type}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{new Date(ev.event_date ?? ev.activity_date ?? '').toLocaleDateString()}</div>
              <div className="mt-1 text-xs text-muted-foreground">{ev.location}</div>
              <div className="mt-1 text-xs text-muted-foreground">{excerpt(ev.content, 44)}</div>
              <div className="mt-2">
                <Button asChild size="sm"><Link href={`/events/${ev.id}`}>View</Link></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex justify-end mb-[14px]">
        <Button asChild size="sm" variant="ghost"><Link href="/events">..more</Link></Button>
      </div>
    </div>
  )
}

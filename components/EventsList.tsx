"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface EventItem {
  id: number;
  title: string;
  activity_date: string;
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

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {events.map(ev => (
        <Card key={ev.id} className="flex flex-col">
          {ev.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ev.image_url} alt={ev.title} className="h-40 w-full object-cover rounded-t-md" />
          )}
          <CardContent>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{ev.title}</CardTitle>
              <div className="text-sm text-muted-foreground">{ev.type}</div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{new Date(ev.activity_date || ev.event_date).toLocaleDateString()}</div>
            <div className="mt-3 text-sm text-muted-foreground">{ev.location}</div>
            <div className="mt-3 text-sm">{excerpt(ev.content)}</div>
            <div className="mt-4">
              <Button asChild size="sm"><Link href={`/events/${ev.id}`}>View Details</Link></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { formatDateShort } from '@/lib/utils';
import { Hash, Tag } from 'lucide-react';

export const revalidate = 60; // cache for 60s

export default async function TrendingPage() {
  const supabase = createClient();

  // Fetch trending hashtags and activity types from the backend (supabase views or tables)
  // Fallback: call existing /api/search/trending if available
  let hashtags: { tag: string; count: number }[] = [];
  let types: { type: string; count: number }[] = [];

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3000}`);
    const res = await fetch(`${baseUrl}/api/search/trending`, { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      hashtags = d.hashtags || [];
      types = d.types || [];
    }
  } catch (e) {
    // ignore, will try Supabase directly
  }

  // Try Supabase as a fallback
  if (!hashtags.length || !types.length) {
    try {
      const { data: h } = await supabase.from('activity_tags').select('tag, count').order('count', { ascending: false }).limit(50);
      if (Array.isArray(h)) hashtags = h as any;
    } catch (e) {}

    try {
      const { data: t } = await supabase.from('activity_type_counts').select('type, count').order('count', { ascending: false }).limit(50);
      if (Array.isArray(t)) types = t as any;
    } catch (e) {}
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4 md:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Trending</h1>
          <Link href="/search" className="text-sm text-muted-foreground">Search</Link>
        </header>

        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2"><Hash className="h-5 w-5" /> Trending Hashtags</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {hashtags.length ? hashtags.map((h) => (
              <Link key={h.tag} href={`/search?tag=${encodeURIComponent(h.tag)}`} className="rounded-md bg-white px-3 py-2 shadow-sm flex items-center justify-between">
                <span className="truncate text-sm">#{h.tag}</span>
                <span className="ml-2 text-xs text-muted-foreground">{h.count}</span>
              </Link>
            )) : (
              <div className="text-sm text-muted-foreground">No trending hashtags</div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2"><Tag className="h-5 w-5" /> Activity Types</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {types.length ? types.map((t) => (
              <Link key={t.type} href={`/search?type=${encodeURIComponent(t.type)}`} className="rounded-md bg-white px-3 py-2 shadow-sm flex items-center justify-between">
                <span className="truncate text-sm">{t.type}</span>
                <span className="ml-2 text-xs text-muted-foreground">{t.count}</span>
              </Link>
            )) : (
              <div className="text-sm text-muted-foreground">No activity types</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

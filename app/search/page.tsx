import { createClient } from '@/lib/supabase/server';
import ActivityFeedCard from '@/components/ActivityFeedCard';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const revalidate = 0;

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string, type?: string, tag?: string, page?: string } }) {
  const supabase = await createClient();
  const params = (searchParams as any) || {};
  const q = params.q || '';
  const type = params.type || null;
  const tag = params.tag || null;
  const page = parseInt(params.page || '1', 10) || 1;
  const perPage = 12;
  const offset = (page - 1) * perPage;

  const { data: results, error: resErr } = await supabase.rpc('search_activities', { in_query: q, in_type: type, in_tag: tag, in_limit: perPage, in_offset: offset }) as any;
  const { data: countRes } = await supabase.rpc('search_activities_count', { in_query: q, in_type: type, in_tag: tag }) as any;

  let total = 0;
  if (Array.isArray(countRes) && countRes.length) total = (countRes[0] as any).search_activities_count || (countRes[0] as any).count || 0;
  else if (typeof countRes === 'number') total = countRes;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Search Results</h1>
        <p className="mt-2 text-sm text-muted-foreground">{total} results for <strong>{q || (tag ? `#${tag}` : '')}</strong></p>
      </div>

      {(!results || results.length === 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>No results</CardTitle>
            <CardDescription>Try a different query or remove filters.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Use the search box in the header to try another search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {results.map((r:any) => (
            <div key={r.id} className="w-full"><ActivityFeedCard activity={r} /></div>
          ))}
        </div>
      )}

      {/* pagination */}
      {total > perPage && (
        <div className="mt-8 flex items-center justify-center gap-3">
          {Array.from({ length: Math.ceil(total / perPage) }).map((_, i) => (
            <Link key={i} href={`/search?q=${encodeURIComponent(q || '')}&page=${i+1}`} className={`px-3 py-2 rounded ${i+1 === page ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}>{i+1}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

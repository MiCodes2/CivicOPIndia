import SearchBar from '@/components/SearchBar'
import { createClient } from '@/lib/supabase/server'
import { pageMetadata } from '@/lib/pageMetadata'

export const metadata = pageMetadata.search

export default async function Page() {
  const supabase = await createClient()
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/search/trending`, { cache: 'no-store' })
  let trending = []
  try {
    const json = await res.json()
    trending = json.trending || []
  } catch {}

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Search</h1>
      <div className="mt-4">
        {/* client search bar */}
        {/* @ts-ignore */}
        <SearchBar />
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Trending Hashtags</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {trending.map((t: any) => (
            <a key={t.tag} href={`/search?q=${encodeURIComponent(t.tag)}`} className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
              #{t.tag} ({t.count})
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

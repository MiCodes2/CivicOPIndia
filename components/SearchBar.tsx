"use client"

import { useState, useEffect } from 'react'

export default function SearchBar({ initial = '' }: { initial?: string }) {
  const [q, setQ] = useState(initial)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => {
      if (!q) return setResults([])
      setLoading(true)
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then(async (r) => {
          const json = await r.json().catch(() => ({}))
          // If server indicates Supabase isn't configured, fallback to DOM search
          if (json?.error === 'no-supabase' || r.status === 501) {
            // Search the rendered DOM across common content containers (headers, paragraphs, sections)
            try {
              const lc = q.toLowerCase()
              const candidates = Array.from(document.querySelectorAll('article, section, main, header, .prose, p, h1, h2, h3')) as HTMLElement[]
              const found: any[] = []
              const seen = new Set<HTMLElement>()
              for (const n of candidates) {
                if (seen.has(n)) continue
                const text = (n.textContent || '').toLowerCase()
                if (!text.includes(lc)) continue
                // prefer closest heading as title
                const heading = n.querySelector('h1,h2,h3') || n.closest('article')?.querySelector('h1,h2,h3')
                const title = (heading && (heading.textContent || '').trim()) || (n.getAttribute('aria-label') || '').toString().trim() || (n.textContent || '').trim().slice(0, 80)
                // ensure element has an id we can scroll to
                if (!n.id) {
                  n.id = 'search-' + Math.random().toString(36).slice(2, 9)
                }
                seen.add(n)
                found.push({ id: n.id, title: title || `Result ${found.length + 1}`, author_name: '' })
                if (found.length >= 20) break
              }
              return setResults(found)
            } catch (e) {
              return setResults([])
            }
          }
          return setResults(json.results || [])
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(id)
  }, [q])

  return (
    <div className="w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search activities, tags, authors..."
        className="w-full rounded-md border px-3 py-2"
      />

      {loading && <div className="mt-2 text-sm text-muted-foreground">Searching…</div>}

      {!loading && results.length > 0 && (
        <ul className="mt-2 space-y-2">
          {results.slice(0, 10).map((r: any) => (
            <li key={r.id} className="p-2 border rounded-md">
              <a href={`/activities#activity-${r.id}`} className="font-semibold">
                {r.title || 'Untitled'}
              </a>
              <div className="text-sm text-muted-foreground">{r.author_name}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

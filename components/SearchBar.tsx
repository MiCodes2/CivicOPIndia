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
        .then((r) => r.json())
        .then((json) => setResults(json.results || []))
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

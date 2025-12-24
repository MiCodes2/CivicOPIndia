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
          {results.slice(0, 10).map((r: any) => {
            const targetId = `${r.id}`.startsWith('activity-') ? r.id : r.id;
            const href = `/activities#${targetId}`;
            return (
              <li key={r.id} className="p-2 border rounded-md">
                <a
                  href={href}
                  className="font-semibold"
                  onClick={(e) => {
                    try {
                      const url = new URL(href, window.location.origin)
                      // If link is same-page or we can find target element, intercept
                      const el = document.getElementById(targetId)
                      if (el) {
                        e.preventDefault()
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        // highlight matched terms inside element
                        highlightMatches(el, q)
                        // update hash without jumping
                        history.replaceState({}, '', `#${targetId}`)
                      }
                      // otherwise allow default navigation
                    } catch (err) {
                      // allow default navigation on error
                    }
                  }}
                >
                  {r.title || 'Untitled'}
                </a>
                <div className="text-sm text-muted-foreground">{r.author_name}</div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function highlightMatches(container: HTMLElement, query: string) {
  if (!query) return
  // remove previous highlights
  const prev = container.querySelectorAll('mark.search-highlight')
  prev.forEach((m) => {
    const parent = m.parentNode
    if (!parent) return
    parent.replaceChild(document.createTextNode(m.textContent || ''), m)
  })

  const text = query.trim()
  if (!text) return
  const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig')

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)

  nodes.forEach((node) => {
    const parent = node.parentElement
    if (!parent) return
    const val = node.nodeValue || ''
    if (!regex.test(val)) return
    const frag = document.createDocumentFragment()
    let lastIndex = 0
    val.replace(regex, (match, offset) => {
      const before = val.substring(lastIndex, offset)
      if (before) frag.appendChild(document.createTextNode(before))
      const mark = document.createElement('mark')
      mark.className = 'search-highlight'
      mark.style.background = 'yellow'
      mark.style.color = 'inherit'
      mark.textContent = match
      frag.appendChild(mark)
      lastIndex = offset + match.length
      return match
    })
    const after = val.substring(lastIndex)
    if (after) frag.appendChild(document.createTextNode(after))
    parent.replaceChild(frag, node)
  })

  // remove highlights after a short delay
  setTimeout(() => {
    const marks = container.querySelectorAll('mark.search-highlight')
    marks.forEach((m) => {
      const parent = m.parentNode
      if (!parent) return
      parent.replaceChild(document.createTextNode(m.textContent || ''), m)
    })
  }, 5000)
}

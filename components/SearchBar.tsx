"use client"

import { useState, useEffect } from 'react'
import { SEARCH_PAGES } from '../lib/searchPages'

export default function SearchBar({ initial = '', disableSuggestions = false }: { initial?: string, disableSuggestions?: boolean }) {
  const [q, setQ] = useState(initial)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // On page load: if URL has `q` param, highlight matches on this page
    try {
      const params = new URLSearchParams(window.location.search)
      const incoming = params.get('q')
      if (incoming && incoming.trim()) {
        // Delay slightly for client rendering
        setTimeout(() => {
          try {
            // find first element which contains query and scroll+highlight
            const lc = incoming.toLowerCase()
            const candidates = Array.from(document.querySelectorAll('article, section, main, header, .prose, p, h1, h2, h3')) as HTMLElement[]
            let first: HTMLElement | null = null
            for (const n of candidates) {
              if ((n.textContent || '').toLowerCase().includes(lc)) {
                first = n
                break
              }
            }
            if (first) {
              first.scrollIntoView({ behavior: 'smooth', block: 'center' })
              highlightMatches(first, incoming)
            } else {
              // fallback: highlight entire document
              highlightMatches(document.body as HTMLElement, incoming)
            }
          } catch (e) {
            // ignore
          }
        }, 250)
      }
    } catch (e) {
      // ignore in non-browser
    }
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
              const found: any[] = []
              const seen = new Set<string>()
              const lc = q.toLowerCase()
              // 1) scan current page first
              const candidates = Array.from(document.querySelectorAll('article, section, main, header, .prose, p, h1, h2, h3')) as HTMLElement[]
              for (const n of candidates) {
                const text = (n.textContent || '').toLowerCase()
                if (!text.includes(lc)) continue
                const heading = n.querySelector('h1,h2,h3') || n.closest('article')?.querySelector('h1,h2,h3')
                const title = (heading && (heading.textContent || '').trim()) || (n.getAttribute('aria-label') || '') || (n.textContent || '').trim().slice(0, 80)
                if (!n.id) n.id = 'search-' + Math.random().toString(36).slice(2, 9)
                if (seen.has(n.id)) continue
                seen.add(n.id)
                found.push({ id: n.id, title: title || `Result ${found.length + 1}`, path: window.location.pathname, snippet: (n.textContent || '').slice(0, 200) })
                if (found.length >= 20) break
              }

              // 2) fetch and scan a small set of other pages (manifest)
              const pageFetches: Promise<void>[] = []
              const MAX_PER_PAGE = 3
              const cache: Record<string, string> = {}
              for (const pj of SEARCH_PAGES) {
                // skip current path
                if (pj.path === window.location.pathname) continue
                pageFetches.push((async () => {
                  try {
                    const url = pj.path
                    const res = await fetch(url)
                    const html = await res.text()
                    cache[url] = html
                    const parser = new DOMParser()
                    const doc = parser.parseFromString(html, 'text/html')
                    const sel = (pj.selectors || ['main', 'article', '.prose', 'p', 'h1,h2,h3']).join(',')
                    const nodes = Array.from(doc.querySelectorAll(sel)) as HTMLElement[]
                    let perPage = 0
                    for (const n of nodes) {
                      if (perPage >= MAX_PER_PAGE) break
                      const text = (n.textContent || '').toLowerCase()
                      if (!text.includes(lc)) continue
                      const heading = n.querySelector(pj.titleSelector || 'h1,h2,h3')
                      const title = (heading && (heading.textContent || '').trim()) || (doc.querySelector(pj.titleSelector || 'h1')?.textContent || '') || (n.textContent || '').trim().slice(0, 80)
                      const rid = 'search-' + Math.random().toString(36).slice(2, 9)
                      perPage++
                      if (seen.has(pj.path + '::' + rid)) continue
                      seen.add(pj.path + '::' + rid)
                      found.push({ id: rid, title: title || pj.path, path: pj.path, snippet: (n.textContent || '').slice(0, 240) })
                    }
                  } catch (e) {
                    // ignore fetch errors per-page
                  }
                })())
              }
              await Promise.all(pageFetches)
              return setResults(found)
            } catch (e) {
              return setResults([])
            }
          }
          // server returned DB-backed results (activities)
          if (Array.isArray(json.results) && json.results.length > 0) return setResults(json.results || [])

          // if server returned empty results, still try a lightweight cross-page DOM fetch (best-effort)
          try {
            const found: any[] = []
            const lc = q.toLowerCase()
            const seen = new Set<string>()
            for (const pj of SEARCH_PAGES) {
              try {
                const res = await fetch(pj.path)
                const html = await res.text()
                const parser = new DOMParser()
                const doc = parser.parseFromString(html, 'text/html')
                const sel = (pj.selectors || ['main', 'article', '.prose', 'p', 'h1,h2,h3']).join(',')
                const nodes = Array.from(doc.querySelectorAll(sel)) as HTMLElement[]
                for (const n of nodes) {
                  const text = (n.textContent || '').toLowerCase()
                  if (!text.includes(lc)) continue
                  const heading = n.querySelector(pj.titleSelector || 'h1,h2,h3')
                  const title = (heading && (heading.textContent || '').trim()) || (doc.querySelector(pj.titleSelector || 'h1')?.textContent || '') || (n.textContent || '').trim().slice(0, 80)
                  const rid = 'search-' + Math.random().toString(36).slice(2, 9)
                  if (seen.has(pj.path + '::' + rid)) continue
                  seen.add(pj.path + '::' + rid)
                  found.push({ id: rid, title: title || pj.path, path: pj.path, snippet: (n.textContent || '').slice(0, 240) })
                  if (found.length >= 20) break
                }
                if (found.length >= 20) break
              } catch (e) {
                // ignore
              }
            }
            return setResults(found)
          } catch (e) {
            return setResults([])
          }
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

      {!loading && !disableSuggestions && results.length > 0 && (
        <ul className="mt-2 space-y-2">
          {results.slice(0, 10).map((r: any) => {
            const isActivity = typeof r.type === 'string' || (`${r.id}`.startsWith('activity-'))
            let href = '#'
            if (isActivity) {
              const targetId = `${r.id}`.startsWith('activity-') ? r.id : r.id
              href = `/activities#${targetId}`
            } else if (r.path) {
              // navigate to page and include `q` param so target page can highlight
              href = `${r.path}?q=${encodeURIComponent(q)}`
            } else if (typeof window !== 'undefined' && r.path === window.location.pathname) {
              href = `#${r.id}`
            }

            const truncate = (s: string, n = 120) => (s && s.length > n ? s.slice(0, n).trim() + '…' : s)

            return (
              <li key={r.id + (r.path || '')}>
                <a
                  href={href}
                  className="block p-2 border rounded-md"
                  onClick={(e) => {
                    try {
                      const url = new URL(href, window.location.origin)
                      // If link is same-page or we can find target element, intercept
                      if (url.pathname === window.location.pathname && url.hash) {
                        const el = document.getElementById(url.hash.replace('#', ''))
                        if (el) {
                          e.preventDefault()
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          highlightMatches(el, q)
                          history.replaceState({}, '', url.hash)
                          return
                        }
                      }
                      // If navigating to another page, allow default navigation — that page will read `q` and highlight on load
                    } catch (err) {
                      // allow default navigation on error
                    }
                  }}
                >
                  <div className="font-semibold">{r.title || 'Untitled'}</div>
                  {r.snippet && <div className="text-sm text-muted-foreground mt-1">{truncate(r.snippet || '', 120)}</div>}
                  {r.author_name && <div className="text-sm text-muted-foreground">{r.author_name}</div>}
                </a>
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

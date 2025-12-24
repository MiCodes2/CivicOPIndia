"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar({ initial = '' }: { initial?: string }) {
  const [q, setQ] = useState(initial || '');
  const [suggestions, setSuggestions] = useState<Array<any>>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}&limit=6`, { signal: abortRef.current.signal });
        const json = await res.json();
        setSuggestions(json.suggestions || []);
        setOpen(true);
      } catch (e) {
        // ignore
      }
    }, 200);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [q]);

  const submit = (val?: string) => {
    const payload = (val ?? q).trim();
    if (!payload) {
      router.push('/search');
      return;
    }
    router.push(`/search?q=${encodeURIComponent(payload)}`);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="Search CivicOPIndia..."
          className="w-full rounded border px-3 py-2 text-sm"
          aria-label="Search CivicOPIndia"
        />
        <button onClick={() => submit()} className="ml-2 rounded bg-primary px-3 py-2 text-white">Search</button>
      </div>

      {open && suggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded border bg-card shadow">
          <ul className="max-h-64 overflow-auto">
            {suggestions.map((s: any) => (
              <li key={s.id}>
                <button
                  onClick={() => submit(s.title)}
                  className="w-full text-left px-3 py-2 hover:bg-muted"
                >
                  <div className="font-medium">{s.title}</div>
                  {s.excerpt && <div className="text-xs text-muted-foreground truncate">{s.excerpt}</div>}
                </button>
              </li>
            ))}
            <li>
              <button onClick={() => submit()} className="w-full text-left px-3 py-2 text-sm text-muted-foreground">Search for “{q}”</button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

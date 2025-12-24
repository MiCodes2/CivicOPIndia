"use client";

import React, { useMemo, useState, useEffect } from "react";
import ActivityFeedCard from "@/components/ActivityFeedCard";
import type { Activity } from "@/lib/types/database";
import { extractHashtags } from "@/lib/utils";

interface Props {
  activities: Activity[];
  types?: string[];
  initialSelected?: string | null;
  initialQuery?: string | null;
}

export default function ActivitiesClientList({ activities, types = [], initialSelected = null, initialQuery = null }: Props) {
  const [selected, setSelected] = useState<string | null>(initialSelected || null);
  const [query, setQuery] = useState<string>(initialQuery || '');

  useEffect(() => {
    // initialize from URL params if present
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || params.get('tag') || '';
      if (q && !query) setQuery(q.startsWith('#') ? q : (params.get('tag') ? `#${q}` : q));
      const t = params.get('type');
      if (t && !selected) setSelected(t);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach((a) => {
      const t = (a.type || 'Other').toString();
      map[t] = (map[t] || 0) + 1;
    });
    return map;
  }, [activities]);

  const displayTypes = types && types.length ? types : Array.from(new Set(activities.map(a=> (a.type||'Other').toString())));

  // compute trending tags from activities
  const trending = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    activities.forEach((a:any) => {
      const tags = (a.tags && a.tags.length) ? a.tags.map((t:string)=>String(t).toLowerCase()) : extractHashtags(a.content || '');
      (tags || []).forEach((tg:string) => { if (!tg) return; tagCounts[tg] = (tagCounts[tg] || 0) + 1; });
    });
    return Object.entries(tagCounts).sort((a,b)=> b[1]-a[1]).slice(0,8).map(([t,c])=>({tag:t,count:c}));
  }, [activities]);

  // sync URL when filter/query changes
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      if (selected) params.set('type', selected); else params.delete('type');
      if (query) {
        const q = query.startsWith('#') ? query.replace(/^#/, '') : query;
        params.set('q', query);
        params.set('tag', q);
      } else {
        params.delete('q');
        params.delete('tag');
      }
      window.history.pushState({}, '', `${url.pathname}?${params.toString()}`);
    } catch {
      // ignore
    }
  }, [selected, query]);

  // filter logic (type + query)
  const filtered = useMemo(() => {
    let res = activities.slice();
    if (selected) res = res.filter(a => (a.type || 'Other') === selected);
    if (query && query.trim()) {
      const qRaw = query.trim();
      if (qRaw.startsWith('#')) {
        const tag = qRaw.replace(/^#/, '').toLowerCase();
        res = res.filter(a => {
          const tags = (a.tags || []).map((t:any)=>String(t).toLowerCase());
          if (tags.includes(tag)) return true;
          const ext = extractHashtags(a.content || '');
          return ext.includes(tag);
        });
      } else {
        const lower = qRaw.toLowerCase();
        res = res.filter(a => {
          const t = (a.title || '').toLowerCase();
          const c = (a.content || '').toLowerCase();
          const au = (a.author_name || '').toLowerCase();
          return t.includes(lower) || c.includes(lower) || au.includes(lower);
        });
      }
    }
    return res;
  }, [activities, selected, query]);

  function openOnSite(q:string) {
    if (!q) {
      window.location.href = '/activities';
      return;
    }
    const payload = q.trim();
    if (payload.startsWith('#')) {
      const tag = encodeURIComponent(payload.replace(/^#/, ''));
      window.location.href = `/activities?tag=${tag}`;
    } else {
      const encoded = encodeURIComponent(payload);
      window.location.href = `/activities?q=${encoded}`;
    }
  }

  return (
    <div className="flex flex-col items-center w-full">

      {/* Search + small-screen cards */}
      <div className="w-full max-w-4xl mx-auto mb-6 px-4">
        <div className="flex gap-2 items-center">
          <input
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            placeholder="Search activities, hashtags (use #) or people..."
            className="flex-1 rounded border px-3 py-2"
          />
          <button onClick={() => openOnSite(query)} className="ml-2 rounded bg-primary px-4 py-2 text-white">Search on CivicOPIndia</button>
        </div>

        {/* Mobile: Types & Trending stacked above feed */}
        <div className="block lg:hidden mt-4 space-y-4">
          <div className="bg-card rounded-xl p-0 shadow">
            <div className="p-4 border-b">
              <div className="text-lg font-semibold">Types</div>
              <div className="text-sm text-muted-foreground">Filter by type</div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                <li>
                  <button onClick={()=> setSelected(null)} className={`block w-full text-left px-3 py-1 rounded ${!selected ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>All ({filtered.length})</button>
                </li>
                {displayTypes.map((t:any)=> (
                  <li key={t}>
                    <button onClick={()=> setSelected(t)} className={`block w-full text-left px-3 py-1 rounded ${selected === t ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>{t} <span className="text-muted-foreground">({counts[t] || 0})</span></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-card rounded-xl p-0 shadow">
            <div className="p-4 border-b">
              <div className="text-lg font-semibold">Trending</div>
              <div className="text-sm text-muted-foreground">Top hashtags</div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {trending.map(t => (
                  <li key={t.tag} className="flex items-center justify-between">
                    <div className="flex-1">
                      <button onClick={() => setQuery(`#${t.tag}`)} className="text-left w-full px-3 py-1 rounded hover:bg-gray-100">#{t.tag}</button>
                    </div>
                    <div className="text-sm text-muted-foreground px-3">{t.count}</div>
                    <div className="pl-2">
                      <a aria-label={`Search #${t.tag} on CivicOPIndia`} href={`/activities?tag=${encodeURIComponent(t.tag)}`} className="text-sm text-primary">Search on CivicOPIndia</a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col items-center w-full">
        {filtered.map(act => (
          <div key={act.id} className="w-full px-4 mb-4"><div className="mx-auto w-full max-w-4xl"><ActivityFeedCard activity={act} /></div></div>
        ))}
      </div>
    </div>
  );
}

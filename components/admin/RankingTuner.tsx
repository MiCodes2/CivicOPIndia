"use client";

import React, { useState } from 'react';

export default function RankingTuner() {
  const [q, setQ] = useState('');
  const [wRank, setWRank] = useState(0.8);
  const [wTag, setWTag] = useState(0.3);
  const [wTitle, setWTitle] = useState(0.5);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function preview() {
    const query = q.trim();
    if (!query) { alert('Enter a query to preview'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/preview?q=${encodeURIComponent(query)}&w_rank=${encodeURIComponent(String(wRank))}&w_tag=${encodeURIComponent(String(wTag))}&w_title=${encodeURIComponent(String(wTitle))}&limit=10`);
      const json = await res.json();
      if (json.results) setResults(json.results || []);
      else alert(json.error || 'No results');
    } catch (e) {
      alert('Error fetching preview');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="query" className="rounded border px-3 py-2 flex-1" />
        <button onClick={preview} className="rounded bg-primary px-3 py-2 text-white">Preview</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Rank weight</div>
          <input type="range" min="0" max="2" step="0.1" value={wRank} onChange={(e)=>setWRank(parseFloat(e.target.value))} />
          <div className="text-sm">{wRank}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Tag weight</div>
          <input type="range" min="0" max="2" step="0.1" value={wTag} onChange={(e)=>setWTag(parseFloat(e.target.value))} />
          <div className="text-sm">{wTag}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Title weight</div>
          <input type="range" min="0" max="2" step="0.1" value={wTitle} onChange={(e)=>setWTitle(parseFloat(e.target.value))} />
          <div className="text-sm">{wTitle}</div>
        </div>
      </div>

      <div>
        {loading ? <div>Loading...</div> : (
          <ul className="space-y-2">
            {results.map(r => (
              <li key={r.id} className="border rounded p-2">
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-muted-foreground truncate">{r.content?.slice(0,200)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";

interface Props {
  types: string[];
  counts: Record<string, number>;
}

const CANONICAL = [
  'Meetings',
  'Campaigns',
  'Protests',
  'Drive',
  'Plantation',
  'Other',
];

export default function ActivityTypeManager({ types, counts }: Props) {
  const [mapping, setMapping] = useState<Record<string,string>>(() => {
    const m: Record<string,string> = {};
    types.forEach(t => m[t]='');
    return m;
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{from:string,to:string,error?:any}>>([]);

  const apply = async () => {
    const payload = Object.entries(mapping)
      .filter(([,to]) => to && to.length)
      .map(([from,to]) => ({ from, to }));
    if (payload.length === 0) { setMessage('No mappings selected'); return; }
    // Ask for confirmation before making changes
    const ok = confirm(`Apply ${payload.length} mapping(s)? This will UPDATE rows in the database.`);
    if (!ok) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/rename-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || JSON.stringify(data));
      setResults(data.results || []);
      setMessage('Renames applied');
    } catch (e: any) {
      setMessage('Error: ' + (e.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  const buildSQL = () => {
    const payload = Object.entries(mapping)
      .filter(([,to]) => to && to.length)
      .map(([from,to]) => ({ from, to }));
    if (payload.length === 0) return '-- No mappings selected';
    return payload.map(p => `UPDATE activities SET type = '${p.to.replace("'","''")}' WHERE type = '${p.from.replace("'","''")}' ;`).join('\n');
  };

  const [showPreview, setShowPreview] = React.useState(false);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium">Manage Types</h3>
      <p className="text-sm text-muted-foreground">Select a canonical type to rename existing values into.</p>
      <div className="mt-3 space-y-2">
        {types.map((t) => (
          <div key={t} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium">{t}</div>
              <div className="text-sm text-muted-foreground">{counts[t] || 0} {counts[t] === 1 ? 'post' : 'posts'}</div>
            </div>
            <select
              className="rounded border px-2 py-1"
              value={mapping[t] || ''}
              onChange={(e) => setMapping(prev => ({ ...prev, [t]: e.target.value }))}
            >
              <option value="">— keep —</option>
              {CANONICAL.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          className="inline-flex items-center rounded bg-primary px-3 py-1 text-white disabled:opacity-50"
          onClick={apply}
          disabled={loading}
        >
          {loading ? 'Applying...' : 'Apply Mappings'}
        </button>
        <button className="text-sm text-muted-foreground" onClick={() => { setMapping(types.reduce((acc,t)=>({ ...acc, [t]: '' }),{})); setMessage(null); }}>
          Reset
        </button>
        {message && <div className="ml-4 text-sm">{message}</div>}
        {results.length > 0 && (
          <div className="ml-4">
            <div className="text-sm font-medium">Results:</div>
            <ul className="mt-2 text-sm list-disc list-inside">
              {results.map(r => (
                <li key={r.from+":"+r.to}>
                  {r.from} → {r.to} {r.error ? `(error: ${JSON.stringify(r.error)})` : '✓'}
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <button className="text-sm text-primary" onClick={() => location.reload()}>Refresh page</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

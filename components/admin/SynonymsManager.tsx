"use client";

import React, { useEffect, useState } from 'react';

export default function SynonymsManager() {
  const [synonyms, setSynonyms] = useState<any[]>([]);
  const [term, setTerm] = useState('');
  const [canonical, setCanonical] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch('/api/search/synonyms');
      const json = await res.json();
      setSynonyms(json.synonyms || []);
    } catch (e) {
      // ignore
    } finally { setLoading(false); }
  }

  async function addOne() {
    if (!term || !canonical) return;
    setLoading(true);
    try {
      const res = await fetch('/api/search/synonyms', { method: 'POST', body: JSON.stringify({ term, canonical }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!json.error) {
        setTerm(''); setCanonical('');
        fetchList();
      } else {
        alert(json.error);
      }
    } catch (e) {
      // ignore
    } finally { setLoading(false); }
  }

  async function removeOne(id:any) {
    if (!confirm('Delete this synonym?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search/synonyms?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.error) fetchList(); else alert(json.error);
    } catch (e) {
      // ignore
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchList(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={term} onChange={(e)=>setTerm(e.target.value)} placeholder="term" className="rounded border px-3 py-2" />
        <input value={canonical} onChange={(e)=>setCanonical(e.target.value)} placeholder="canonical" className="rounded border px-3 py-2" />
        <button onClick={addOne} className="rounded bg-primary px-3 py-2 text-white">Add</button>
      </div>

      <div>
        {loading ? <div>Loading...</div> : (
          <ul className="space-y-2">
            {synonyms.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-4">
                <div><strong>{s.term}</strong> → {s.canonical}</div>
                <div><button onClick={()=>removeOne(s.id)} className="text-sm text-red-500">Delete</button></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

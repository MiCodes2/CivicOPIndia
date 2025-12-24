"use client";

import React, { useEffect, useState } from 'react';

export default function StopwordsManager() {
  const [list, setList] = useState<any[]>([]);
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch('/api/search/stopwords');
      const json = await res.json();
      setList(json.stopwords || []);
    } catch (e) {
      // ignore
    } finally { setLoading(false); }
  }

  async function addOne() {
    const w = (word || '').trim();
    if (!w) { alert('word required'); return; }
    if (list.find(l => l.word.toLowerCase() === w.toLowerCase())) { alert('already exists'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/search/stopwords', { method: 'POST', body: JSON.stringify({ word: w }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!json.error) { setWord(''); fetchList(); } else alert(json.error);
    } catch (e) {
      // ignore
    } finally { setLoading(false); }
  }

  async function removeOne(id:any) {
    if (!confirm('Delete stopword?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search/stopwords?id=${id}`, { method: 'DELETE' });
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
        <input value={word} onChange={(e)=>setWord(e.target.value)} placeholder="word" className="rounded border px-3 py-2" />
        <button onClick={addOne} className="rounded bg-primary px-3 py-2 text-white">Add</button>
      </div>
      <div>
        {loading ? <div>Loading...</div> : (
          <ul className="space-y-2">
            {list.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-4">
                <div className="flex-1">{s.word}</div>
                <div><button onClick={()=>removeOne(s.id)} className="text-sm text-red-500">Delete</button></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

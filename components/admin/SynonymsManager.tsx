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

  async function validateNew(termVal:string, canonicalVal:string) {
    if (!termVal.trim() || !canonicalVal.trim()) return 'Term and canonical are required';
    if (termVal.trim().toLowerCase() === canonicalVal.trim().toLowerCase()) return 'Term and canonical must differ';
    if (synonyms.find(s => s.term && s.term.toLowerCase() === termVal.trim().toLowerCase())) return 'Term already exists';
    return null;
  }

  async function addOne() {
    const err = await validateNew(term, canonical);
    if (err) { alert(err); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/search/synonyms', { method: 'POST', body: JSON.stringify({ term: term.trim(), canonical: canonical.trim() }), headers: { 'Content-Type': 'application/json' } });
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

  async function startEdit(item:any) {
    setSynonyms(synonyms.map(s => s.id === item.id ? { ...s, _editing: true, _term: s.term, _canonical: s.canonical } : s));
  }

  async function cancelEdit(item:any) {
    setSynonyms(synonyms.map(s => s.id === item.id ? { ...s, _editing: false } : s));
  }

  async function saveEdit(item:any) {
    const termVal = item._term?.toString() || '';
    const canonicalVal = item._canonical?.toString() || '';
    if (!termVal.trim() || !canonicalVal.trim()) { alert('Term and canonical are required'); return; }
    if (termVal.trim().toLowerCase() === canonicalVal.trim().toLowerCase()) { alert('Term and canonical must differ'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/search/synonyms', { method: 'PUT', body: JSON.stringify({ id: item.id, term: termVal.trim(), canonical: canonicalVal.trim() }), headers: { 'Content-Type': 'application/json' } });
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
                <div className="flex-1">
                  {!s._editing ? (
                    <div><strong>{s.term}</strong> → {s.canonical}</div>
                  ) : (
                    <div className="flex gap-2">
                      <input className="rounded border px-2 py-1" value={s._term} onChange={(e)=> setSynonyms(synonyms.map(x => x.id === s.id ? { ...x, _term: e.target.value } : x))} />
                      <input className="rounded border px-2 py-1" value={s._canonical} onChange={(e)=> setSynonyms(synonyms.map(x => x.id === s.id ? { ...x, _canonical: e.target.value } : x))} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!s._editing ? (
                    <>
                      <button onClick={()=>startEdit(s)} className="text-sm text-primary">Edit</button>
                      <button onClick={()=>removeOne(s.id)} className="text-sm text-red-500">Delete</button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>saveEdit(s)} className="text-sm text-primary">Save</button>
                      <button onClick={()=>cancelEdit(s)} className="text-sm text-muted-foreground">Cancel</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

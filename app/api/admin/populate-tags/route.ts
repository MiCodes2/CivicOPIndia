import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function extractTagsFromText(text?: string) {
  if (!text) return [];
  const stripped = text.replace(/<[^>]*>/g, ' ');
  const re = /#([a-zA-Z0-9_\-]+)/g;
  const set = new Set();
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(stripped)) !== null) {
    const t = (m[1] || '').toLowerCase();
    if (t) set.add(t);
  }
  return Array.from(set);
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'missing service key' }, { status: 500 });

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Fetch all activities (id, content, tags)
    const { data: rows, error: fetchErr } = await supabase.from('activities').select('id, content, tags');
    if (fetchErr) return NextResponse.json({ error: fetchErr.message || fetchErr }, { status: 500 });

    const updates: Array<{id:number, tags:string[]}> = [];
    for (const r of (rows || []) as any[]) {
      const id: number = Number(r.id);
      const content: string = (r.content || '').toString();
      const existing: string[] = Array.isArray(r.tags) ? r.tags.map((x:any)=>String(x).toLowerCase()) : [];
      const extractedRaw = extractTagsFromText(content);
      const extracted: string[] = extractedRaw.map(s => String(s).toLowerCase());
      // only update when extracted non-empty and differs from existing (order-insensitive)
      const existingSet = new Set(existing);
      const extractedSet = new Set(extracted);
      const same = existingSet.size === extractedSet.size && Array.from(existingSet).every((s:any) => extractedSet.has(s));
      if (extracted.length > 0 && !same) {
        updates.push({ id, tags: extracted });
      }
    }

    // Apply updates in batches
    const BATCH = 200;
    let updated = 0;
    for (let i = 0; i < updates.length; i += BATCH) {
      const chunk = updates.slice(i, i + BATCH);
      const ids = chunk.map(c => c.id);
      // One way: update each separately (to preserve individual tags)
      for (const c of chunk) {
        await supabase.from('activities').update({ tags: c.tags }).eq('id', c.id);
        updated += 1;
      }
    }

    return NextResponse.json({ ok: true, updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}

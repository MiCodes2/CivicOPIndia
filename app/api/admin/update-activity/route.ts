import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unlink } from 'fs/promises';
import path from 'path';
import { decodeHtmlEntities, normalizeEntities } from '@/lib/formatContent';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'missing service key. Set SUPABASE_SERVICE_ROLE_KEY in your environment (e.g. .env.local for local development).' }, { status: 500 });

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Only allow updating specific fields for safety
    const allowed: Record<string, any> = {};
    const fields = ['title','content','location','type','activity_date','image_url','video_url','likes_count','shares_count','author_name','tags','is_pinned','is_highlighted'];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(body, f)) allowed[f] = body[f];
    }

    // If pinning the post, unpin all other posts first (only one pinned post allowed)
    if (allowed.is_pinned && body.is_pinned === true) {
      // Unpin all other posts
      await supabase.from('activities').update({ is_pinned: false, pinned_at: null }).neq('id', id).eq('is_pinned', true);
      allowed.pinned_at = new Date().toISOString();
    } else if (allowed.is_pinned === false) {
      // If unpinning, clear the pinned_at timestamp
      allowed.pinned_at = null;
    }

    // If highlighting the post, set highlighted_at timestamp
    if (allowed.is_highlighted && body.is_highlighted === true) {
      allowed.highlighted_at = new Date().toISOString();
    } else if (allowed.is_highlighted === false) {
      // If un-highlighting, clear the highlighted_at timestamp
      allowed.highlighted_at = null;
    }

    // convert activity_date to timestamptz if present
    if (allowed.activity_date) {
      try { allowed.activity_date = new Date(allowed.activity_date).toISOString(); } catch {}
    }

    // Decode HTML entities in title/content to avoid storing encoded sequences like &#039;
    if (allowed.title) allowed.title = normalizeEntities(String(allowed.title));
    if (allowed.content) allowed.content = normalizeEntities(String(allowed.content));

    const { error } = await supabase.from('activities').update(allowed).eq('id', id);
    if (error) return NextResponse.json({ error: error.message || error }, { status: 500 });

    // If requested, remove physical files from /public/uploads
    if (Array.isArray(body?.delete_files) && body.delete_files.length > 0) {
      try {
        const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
        for (const u of body.delete_files) {
          try {
            // accept either absolute URLs or relative paths
            let rel = u;
            try {
              const parsed = new URL(u);
              rel = parsed.pathname;
            } catch {
              // not an absolute URL
            }
            // Ensure it points to /uploads
            if (!rel.startsWith('/uploads/')) continue;
            // Prevent directory traversal
            const target = path.resolve(process.cwd(), 'public', rel.replace(/^\/+/, ''));
            if (!target.startsWith(uploadsDir)) continue;
            await unlink(target).catch(() => {});
          } catch (e) {
            // ignore per-file errors
          }
        }
      } catch (e) {
        // ignore overall deletion errors
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}

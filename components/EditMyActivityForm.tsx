"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/RichTextEditor';
import { Input } from '@/components/ui/input';
import ImagePicker from '@/components/admin/ImagePicker';
import ActivityPreviewModal from '@/components/admin/ActivityPreviewModal';
import { Eye } from 'lucide-react';
import { decodeHtmlEntities, normalizeEntities } from '@/lib/formatContent';
import type { Activity } from '@/lib/types/database';

export default function EditMyActivityForm({ activity, onCancel, onSuccess }: { activity: Activity; onCancel: () => void; onSuccess: (updated: Activity) => void }) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [title, setTitle] = useState(activity.title || '');
  const [content, setContent] = useState(activity.content || '');
  const [location, setLocation] = useState(activity.location || '');
  const [videoUrl, setVideoUrl] = useState(activity.video_url || '');

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(activity.image_url ? [activity.image_url] : (activity.image_urls || []));
  const [imageUrls, setImageUrls] = useState<string[]>(activity.image_urls || (activity.image_url ? [activity.image_url] : []));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Start with any existing URLs, then upload new files
      const urls = (imageUrls || []).slice();
      if (imageFiles && imageFiles.length > 0) {
        try {
          const uploads = await Promise.all(imageFiles.slice(0,4).map(async (file) => {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!res.ok) {
              const bodyText = await res.text().catch(() => null);
              throw new Error(`Upload failed (${res.status})${bodyText ? ': '+bodyText : ''}`);
            }
            const d = await res.json();
            if (!d?.url) throw new Error('Upload did not return a URL');
            return d.url;
          }));
          uploads.forEach(u => urls.push(u));
        } catch (uploadErr:any) {
          throw uploadErr;
        }
      }

      const payload: any = { id: activity.id, title: normalizeEntities(title), content: normalizeEntities(content), location, video_url: videoUrl };
      if (urls && urls.length > 0) {
        payload.image_urls = urls;
        payload.image_url = urls[0];
      }

      // Include user's access token in Authorization header (if available) so server can verify author
      const supabase = (await import('@/lib/supabase/client')).createClient();
      let token: string | null = null;
      try { const s = await supabase.auth.getSession(); token = s?.data?.session?.access_token ?? null; } catch (e) { token = null; }

      // Fallback: read raw session from localStorage (older clients or missing API)
      if (!token && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('civic-op-auth');
          if (raw) {
            const parsed = JSON.parse(raw);
            token = parsed?.currentSession?.access_token || parsed?.access_token || parsed?.currentSession?.access_token || null;
          }
        } catch (e) {
          // ignore
        }
      }

      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Dev-time visibility to help debug authorization issues
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.debug('Edit activity payload', { id: activity.id, token, headers });
        } catch {}
      }

      const resp = await fetch('/api/activities/edit', { method: 'POST', headers, body: JSON.stringify(payload), credentials: 'same-origin' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Update failed');
      onSuccess(json.activity as Activity);
    } catch (e: any) {
      alert('Failed to update: ' + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Content</label>
        <RichTextEditor value={content} onChange={(v:any)=>setContent(v)} />
      </div>
      <div>
        <label className="text-sm font-medium">Location</label>
        <Input value={location} onChange={(e)=>setLocation(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Video URL</label>
        <Input value={videoUrl} onChange={(e)=>setVideoUrl(e.target.value)} placeholder="https://drive.google.com/file/d/.../view or https://twitter.com/.../status/..." />
        <p className="text-xs text-muted-foreground mt-1">Optional: Google Drive public links, Twitter/X video posts, YouTube videos</p>
      </div>

      <div>
        <label className="text-sm font-medium">Images</label>
        <ImagePicker max={4} initialFiles={[]} initialPreviews={imagePreviews} initialUrls={imageUrls} onChange={(files, previews, urls) => { setImageFiles(files); setImagePreviews(previews); setImageUrls(urls); }} />
      </div>

      <div className="mt-6 pb-6">
        <div className="sticky bottom-0 bg-white pt-3 flex items-center gap-2 justify-between border-t -mx-4 px-4">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
          <div>
            <Button variant="ghost" onClick={onCancel} aria-label="Close" className="px-2 py-1">Close</Button>
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      <ActivityPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={title}
        content={content}
        location={location}
        activityDate={activity.activity_date}
        activityType={activity.type || undefined}
        imageUrls={[...imagePreviews]}
        videoUrl={videoUrl}
      />
    </form>
  );
}
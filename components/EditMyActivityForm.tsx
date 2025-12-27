"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/RichTextEditor';
import { Input } from '@/components/ui/input';
import ImagePicker from '@/components/admin/ImagePicker';
import type { Activity } from '@/lib/types/database';

export default function EditMyActivityForm({ activity, onCancel, onSuccess }: { activity: Activity; onCancel: () => void; onSuccess: (updated: Activity) => void }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(activity.title || '');
  const [content, setContent] = useState(activity.content || '');
  const [location, setLocation] = useState(activity.location || '');

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

      const payload: any = { id: activity.id, title, content, location };
      if (urls && urls.length > 0) {
        payload.image_urls = urls;
        payload.image_url = urls[0];
      }

      const resp = await fetch('/api/activities/edit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
        <label className="text-sm font-medium">Images</label>
        <ImagePicker max={4} initialFiles={[]} initialPreviews={imagePreviews} initialUrls={imageUrls} onChange={(files, previews, urls) => { setImageFiles(files); setImagePreviews(previews); setImageUrls(urls); }} />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
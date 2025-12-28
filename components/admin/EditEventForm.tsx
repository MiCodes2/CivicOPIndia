"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Tag, Image as ImageIcon } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import ImagePicker from "@/components/admin/ImagePicker";
import { decodeHtmlEntities, normalizeEntities } from '@/lib/formatContent';
type EventType = any;

interface EditEventFormProps {
  event: EventType;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function EditEventForm({ event, onCancel, onSuccess }: EditEventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: event.title || "",
    content: event.content || "",
    location: event.location || "",
    event_date: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    image_url: event.image_url || "",
    image_urls: event.image_url ? [event.image_url] : [],
    type: event.type || "",
    published: event.published || true,
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(event.image_url ? [event.image_url] : []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload: any = { id: event.id, ...formData, title: normalizeEntities(formData.title || ''), content: normalizeEntities(formData.content || '') };

      // Upload any newly added files via ImagePicker
      const imageUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        const filesToUpload = imageFiles.slice(0, 4);
        const uploads = await Promise.all(filesToUpload.map(async (file) => {
          const fd = new FormData(); fd.append('file', file);
          const r = await fetch('/api/upload', { method: 'POST', body: fd });
          if (!r.ok) throw new Error('Upload failed');
          const d = await r.json();
          if (!d?.url) throw new Error('Upload failed');
          return d.url;
        }));
        imageUrls.push(...uploads.filter(Boolean));
      }

      const finalImageUrls = [...(formData.image_urls || []), ...imageUrls].slice(0,4);
      if (finalImageUrls.length > 0) payload.image_url = finalImageUrls[0];
      if (finalImageUrls.length > 0) payload.image_urls = finalImageUrls;

      const res = await fetch('/api/admin/update-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || JSON.stringify(data));
      alert('Event updated');
      onSuccess();
      router.refresh();
    } catch (err:any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Event</CardTitle>
            <CardDescription>Update the event details</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input required value={formData.title} onChange={(e)=>setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <RichTextEditor value={formData.content} onChange={(v)=>setFormData({...formData, content: v})} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium"><Calendar className="mr-2 inline h-4 w-4"/> Event Date *</label>
              <Input type="date" required value={formData.event_date} onChange={(e)=>setFormData({...formData, event_date: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium"><Tag className="mr-2 inline h-4 w-4"/> Type</label>
              <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.type} onChange={(e)=>setFormData({...formData, type: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium"><MapPin className="mr-2 inline h-4 w-4"/> Location</label>
            <Input value={formData.location} onChange={(e)=>setFormData({...formData, location: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium"><ImageIcon className="mr-2 inline h-4 w-4"/> Images (optional)</label>
            <ImagePicker max={4} initialFiles={[]} initialPreviews={imagePreviews} initialUrls={formData.image_urls} onChange={(files: File[], previews: string[], urls: string[])=>{ setImageFiles(files); setImagePreviews(previews); setFormData(fd=>({ ...fd, image_urls: urls, image_url: fd.image_url || urls[0] || '' })); }} />
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Updating...' : 'Update Event'}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Clear</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

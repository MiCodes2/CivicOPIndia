"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Tag, Image as ImageIcon } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import ImagePicker from "@/components/admin/ImagePicker";

interface NewEventFormProps {
  onSuccess?: () => void;
}

const EVENT_TYPES = [
  "Protest",
  "Plantation",
  "Cleanliness Drive",
  "Fundraiser",
  "Meeting",
  "Other",
];

export default function NewEventForm({ onSuccess }: NewEventFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  interface NewEventFormState {
    title: string;
    content: string;
    location: string;
    event_date: string;
    image_url: string;
    image_urls: string[];
    type: string;
  }

  const [formData, setFormData] = useState<NewEventFormState>({
    title: "",
    content: "",
    location: "",
    event_date: new Date().toISOString().split("T")[0],
    image_url: "",
    image_urls: [],
    type: EVENT_TYPES[0],
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const DRAFT_KEY = 'event_draft_v1';
  const DRAFTS_KEY = 'event_drafts_v1';

  interface SavedDraft {
    id: string;
    title: string;
    formData: {
      title?: string;
      content?: string;
      location?: string;
      type?: string;
      event_date?: string;
      image_url?: string;
    };
    image_urls?: string[];
    savedAt: number;
  }

  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);

  function formatDraftAge(ts: number) {
    const diff = Date.now() - ts;
    if (diff < 5000) return 'just now';
    if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    return `${Math.round(diff / 3600000)}h ago`;
  }

  useEffect(() => {
    // Restore autosaved draft and saved drafts list on mount
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setFormData((fd) => ({ ...fd, ...parsed.formData }));
          if (parsed.image_urls && Array.isArray(parsed.image_urls)) {
            setFormData((fd) => ({ ...fd, image_url: parsed.image_urls[0] || fd.image_url }));
          }
          if (parsed.savedAt) setDraftSavedAt(parsed.savedAt);
        }
      }
      const rawList = localStorage.getItem(DRAFTS_KEY);
      if (rawList) {
        try {
          const parsedList = JSON.parse(rawList);
          if (Array.isArray(parsedList)) setDrafts(parsedList);
        } catch {}
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const saveCurrentAsDraft = () => {
    try {
      const titlePrompt = window.prompt('Draft title', formData.title || 'Untitled draft');
      const title = titlePrompt ? titlePrompt.trim() : (formData.title || `Draft ${new Date().toLocaleString()}`);
      const draft: SavedDraft = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        title,
        formData: {
          title: formData.title,
          content: formData.content,
          location: formData.location,
          type: formData.type,
          event_date: formData.event_date,
          image_url: formData.image_url,
        },
        image_urls: formData.image_urls || [],
        savedAt: Date.now(),
      };
      const next = [draft, ...drafts];
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
      setDrafts(next);
      setDraftSavedAt(draft.savedAt);
      alert('Draft saved');
    } catch (e) {
      console.error('Could not save draft', e);
      alert('Failed to save draft');
    }
  };

  const loadDraft = (id: string) => {
    const found = drafts.find(d => d.id === id);
    if (!found) return;
    setFormData((fd) => ({ ...fd, ...found.formData }));
    if (found.image_urls && found.image_urls.length > 0) {
      const imageUrls = found.image_urls || [];
      setImagePreviews(imageUrls as string[]);
      setFormData((fd) => ({ ...fd, image_url: imageUrls[0] || fd.image_url, image_urls: imageUrls }));
    }
    setDraftSavedAt(found.savedAt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteDraft = (id: string) => {
    const next = drafts.filter(d => d.id !== id);
    try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(next)); } catch {}
    setDrafts(next);
  };

  const publishDraft = async (id: string) => {
    const found = drafts.find(d => d.id === id);
    if (!found) return;
    loadDraft(id);
    try {
      // @ts-ignore
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      deleteDraft(id);
    } catch (e) {
      console.error('Publish draft failed', e);
      alert('Publish failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  useEffect(() => {
    const save = () => {
      try {
        const payload = {
          formData: {
            title: formData.title,
            content: formData.content,
            location: formData.location,
            type: formData.type,
            event_date: formData.event_date,
            image_url: formData.image_url,
          },
          image_urls: formData.image_urls || [],
          savedAt: Date.now(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        setDraftSavedAt(payload.savedAt);
      } catch (e) {}
    };

    const id = setTimeout(save, 1000);
    return () => clearTimeout(id);
  }, [formData.title, formData.content, formData.location, formData.type, formData.event_date, formData.image_url, formData.image_urls]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to create events");

      const payload = {
        title: formData.title || null,
        content: formData.content || null,
        location: formData.location || null,
        type: formData.type || null,
        event_date: new Date(formData.event_date).toISOString(),
        image_url: formData.image_url || null,
        tags: ['event'],
        author_id: user.id,
        author_name: 'Admin',
        published: true,
      };

      // If files were selected via ImagePicker, upload them first (limit to 4)
      const imageUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        const filesToUpload = imageFiles.slice(0, 4);
        try {
          const uploads = await Promise.all(filesToUpload.map(async (file) => {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!res.ok) {
              const bodyText = await res.text().catch(() => null);
              throw new Error(`Upload failed (${res.status})${bodyText ? ': ' + bodyText : ''}`);
            }
            const d = await res.json();
            if (!d?.url) throw new Error('Upload did not return a URL');
            return d.url;
          }));
          imageUrls.push(...uploads.filter(Boolean));
        } catch (uploadErr) {
          throw uploadErr;
        }
      }

      // Merge any image URLs added via ImagePicker's URL input
      const finalImageUrls = [...(formData.image_urls || []), ...imageUrls].slice(0, 4);
      if (finalImageUrls.length > 0 && !payload.image_url) payload.image_url = finalImageUrls[0];
      if (finalImageUrls.length > 0) (payload as any).image_urls = finalImageUrls;

      // Insert into the dedicated `events` table
      const insertResult = await supabase.from('events').insert([payload]).select();
      const insertError = (insertResult as any).error || (Array.isArray(insertResult) && insertResult[1]) || null;
      if (insertError) throw insertError;

      setFormData({ title: "", content: "", location: "", event_date: new Date().toISOString().split('T')[0], image_url: "", type: EVENT_TYPES[0], image_urls: [] });
      setImageFiles([]);
      setImagePreviews([]);
      if (onSuccess) onSuccess();
      router.refresh();
      alert('Event created')
    } catch (err:any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Event</CardTitle>
        <CardDescription>Standard events like Protest, Plantation, Cleanliness Drive</CardDescription>
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
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.type} onChange={(e)=>setFormData({...formData, type: e.target.value})}>
                {EVENT_TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium"><MapPin className="mr-2 inline h-4 w-4"/> Location</label>
            <Input value={formData.location} onChange={(e)=>setFormData({...formData, location: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium"><ImageIcon className="mr-2 inline h-4 w-4"/> Images (optional)</label>
            <ImagePicker max={4} initialFiles={[]} initialPreviews={imagePreviews} initialUrls={formData.image_urls} onChange={(files: File[], previews: string[], urls: string[]) => { setImageFiles(files); setImagePreviews(previews); setFormData(fd => ({ ...fd, image_urls: urls, image_url: fd.image_url || (urls && urls[0]) || '' })); }} />
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex items-center justify-between gap-2">
            <div>
              {draftSavedAt && (
                <div className="text-xs text-muted-foreground">Draft saved {formatDraftAge(draftSavedAt)}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={saveCurrentAsDraft} disabled={loading}>Save Draft</Button>
            </div>
          </div>

          {/* Drafts list */}
          {drafts && drafts.length > 0 && (
            <div className="mt-3 space-y-2 rounded-md border p-3">
              <div className="text-sm font-medium">Saved Drafts</div>
              {drafts.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{formatDraftAge(d.savedAt)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => loadDraft(d.id)}>Load</Button>
                    <Button type="button" onClick={() => publishDraft(d.id)}>Publish</Button>
                    <Button type="button" onClick={() => deleteDraft(d.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Event'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { extractHashtags } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Tag, Image as ImageIcon } from "lucide-react";
import type { Activity } from "@/lib/types/database";
import RichTextEditor from "@/components/RichTextEditor";
import ImagePicker from "@/components/admin/ImagePicker";

interface EditActivityFormProps {
  activity: Activity;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function EditActivityForm({ activity, onCancel, onSuccess }: EditActivityFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Support re-uploading images during edit (multiple)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(activity.image_url ? [activity.image_url] : []);
  const [deletedFiles, setDeletedFiles] = useState<string[]>([]);
  const initialRemoteUrlsRef = useRef<string[]>([]);

  const [formData, setFormData] = useState({
    title: activity.title,
    content: activity.content || "",
    location: activity.location || "",
    type: activity.type || "",
    activity_date: new Date(activity.activity_date).toISOString().split('T')[0],
    image_url: activity.image_url || "",
    image_urls: activity.image_url ? [activity.image_url] : [],
    likes_count: activity.likes_count,
    shares_count: activity.shares_count,
  });

  const isValidImageUrl = (val: string) => {
    if (!val) return true;
    if (val.startsWith('/')) return true; // allow local uploads path
    try {
      // absolute URL check
      // eslint-disable-next-line no-new
      new URL(val);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const limited = files.slice(0, 4);
    setImageFiles(limited);
    Promise.all(limited.map((f) => new Promise<string>((res) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.readAsDataURL(f);
    }))).then((previews) => setImagePreviews(previews));
  };

  // On mount, also populate previews from any image URLs embedded in the activity content
  useEffect(() => {
    try {
      const content = activity.content || '';
      const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico)(?:\?[^\s]*)?|\/uploads\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico)(?:\?[^\s]*)?)/gi;
      const matches = Array.from(content.matchAll(imageRegex)).map(m => m[0]);
      const initialImages: string[] = [];
      if (activity.image_url) initialImages.push(activity.image_url);
      for (const m of matches) {
        if (!initialImages.includes(m)) initialImages.push(m);
      }
      if (initialImages.length > 0) {
        setImagePreviews(initialImages.slice(0, 4));
        setFormData((fd) => ({ ...fd, image_urls: initialImages.slice(0, 4), image_url: fd.image_url || initialImages[0] }));
        initialRemoteUrlsRef.current = initialImages.slice(0, 4);
      }
    } catch (e) {
      // ignore
    }
  }, [activity.content, activity.image_url]);

  // Hidden input used by the + Add Images button to append images
  const addInputRef = useRef<HTMLInputElement | null>(null);

  const normalizeUrl = (u: string) => {
    if (!u) return u;
    try {
      const parsed = new URL(u);
      return parsed.pathname;
    } catch {
      return u;
    }
  };

  // Append new images (called by the '+' hidden input)
  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const combinedFiles = [...imageFiles, ...files].slice(0, 4);
    Promise.all(combinedFiles.map((f, i) => {
      if (imagePreviews[i]) return Promise.resolve(imagePreviews[i]);
      return new Promise<string>((res) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result as string);
        r.readAsDataURL(f);
      });
    })).then((previews) => {
      setImageFiles(combinedFiles);
      setImagePreviews(previews.slice(0, 4));
    });
    if (e.target) e.target.value = '';
  };

  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const addImageUrlPrompt = () => {
    setShowImageUrlModal(true);
  };

  const submitImageUrl = () => {
    try {
      const trimmed = imageUrlInput.trim();
      if (!trimmed) return setShowImageUrlModal(false);
      if (!isValidImageUrl(trimmed)) {
        alert('Invalid URL');
        return;
      }
      setFormData((fd) => {
        const arr = (fd.image_urls || []).slice();
        if (arr.length >= 4) {
          alert('Maximum 4 images allowed');
          return fd;
        }
        arr.push(trimmed);
        return { ...fd, image_urls: arr, image_url: fd.image_url || trimmed };
      });
      setImagePreviews((prev) => (prev.length < 4 ? [...prev, trimmed] : prev));
      setImageUrlInput('');
      setShowImageUrlModal(false);
    } catch (e) {
      console.error('Failed to add image URL', e);
      setShowImageUrlModal(false);
    }
  };

  const setPrimaryFromPreview = (idx: number) => {
    const p = imagePreviews[idx];
    if (!p) return;
    setFormData((fd) => ({ ...fd, image_url: p }));
  };

  const setPrimaryFromRemote = (idx: number) => {
    const arr = formData.image_urls || [];
    const u = arr[idx];
    if (!u) return;
    setFormData((fd) => ({ ...fd, image_url: u }));
  };

  const removePreview = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    setFormData((fd) => {
      const remaining = (fd.image_urls || []).slice();
      if (fd.image_url && fd.image_url.startsWith('data:')) {
        const wasPreview = imagePreviews[idx] === fd.image_url;
        if (wasPreview) remaining;
      }
      return { ...fd, image_urls: remaining };
    });
  };

  const removeRemoteImage = (idx: number) => {
    setFormData((fd) => {
      const arr = (fd.image_urls || []).slice();
      const removed = arr.splice(idx, 1);
      let primary = fd.image_url;
      if (primary && removed[0] && primary === removed[0]) {
        primary = arr[0] || '';
      }
      return { ...fd, image_urls: arr, image_url: primary };
    });
  };

  const movePreview = (idx: number, dir: number) => {
    setImagePreviews((prev) => {
      const copy = prev.slice();
      const to = idx + dir;
      if (to < 0 || to >= copy.length) return prev;
      const tmp = copy[to];
      copy[to] = copy[idx];
      copy[idx] = tmp;
      return copy;
    });
    setImageFiles((prev) => {
      const copy = prev.slice();
      const to = idx + dir;
      if (to < 0 || to >= copy.length) return prev;
      const tmp = copy[to];
      copy[to] = copy[idx];
      copy[idx] = tmp;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Start with any existing remote image URLs and then append newly uploaded files
      const imageUrls: string[] = (formData.image_urls || []).slice();
      let imageUrlToUse = formData.image_url || imageUrls[0] || '';
      if (imageFiles && imageFiles.length > 0) {
        const filesToUpload = imageFiles.slice(0, 4);
        try {
          const uploads = await Promise.all(filesToUpload.map(async (file) => {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!res.ok) {
              let ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : (file.type ? file.type.split('/')[1] : 'jpg');
              if (ext === 'jpeg') ext = 'jpg';
              return `/uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            }
            const d = await res.json();
            return d.url;
          }));
          imageUrls.push(...uploads.filter(Boolean));
          if (imageUrls.length > 0) imageUrlToUse = imageUrls[0];
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr);
          setError('Image upload failed');
          setLoading(false);
          return;
        }
      }

      if (!isValidImageUrl(imageUrlToUse)) {
        setError('Image must be a valid absolute URL (https://...) or a local path beginning with /uploads/');
        setLoading(false);
        return;
      }

      // Remove any image URLs from the content that the user removed in the editor
      let contentToUse = formData.content || '';
      try {
        const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico)(?:\?[^\s]*)?|\/uploads\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico)(?:\?[^\s]*)?)/gi;
        contentToUse = (contentToUse || '').replace(imageRegex, (match) => {
          return imageUrls.some((v) => normalizeUrl(v) === normalizeUrl(match)) ? match : '';
        }).replace(/\n{2,}/g, '\n\n').trim();
      } catch (e) {
        // ignore
      }

      // If multiple images uploaded or left, embed secondary images in content so feed shows them
      if (imageUrls.length > 1) {
        const extras = imageUrls.slice(1).map((u) => `\n\n${u}`);
        contentToUse = (contentToUse || '') + '\n\n' + extras.join('');
      }

      // Use server-side admin update to bypass RLS (requires SUPABASE_SERVICE_ROLE_KEY)
      const tags = extractHashtags(contentToUse);
      const payload = { id: activity.id, ...formData, image_url: imageUrlToUse, content: contentToUse, activity_date: new Date(formData.activity_date).toISOString(), tags, delete_files: deletedFiles };
      // If user marked files for deletion, confirm before proceeding
      if (deletedFiles && deletedFiles.length > 0) {
        const ok = window.confirm(`This will permanently delete ${deletedFiles.length} image(s) from the server. Continue?`);
        if (!ok) {
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/admin/update-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || JSON.stringify(data));

      alert("Activity updated successfully!");
      setImageFiles([]);
      setImagePreviews([]);
      setDeletedFiles([]);
      onSuccess();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Activity</CardTitle>
        <CardDescription>
          Update the activity details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              placeholder="e.g., Community Town Hall Meeting"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Description *
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Describe the activity in detail... Use the toolbar to format text and add links."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="activity_date" className="text-sm font-medium">
                <Calendar className="mr-2 inline h-4 w-4" />
                Activity Date *
              </label>
              <Input
                id="activity_date"
                type="date"
                value={formData.activity_date}
                onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                <Tag className="mr-2 inline h-4 w-4" />
                Type
              </label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">Select type</option>
                <option value="Meeting">Meeting</option>
                <option value="Protest">Protest</option>
                <option value="Campaign">Campaign</option>
                <option value="Plantation">Plantation</option>
                <option value="News">News</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              <MapPin className="mr-2 inline h-4 w-4" />
              Location
            </label>
            <Input
              id="location"
              placeholder="e.g., Community Center, Delhi"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="image_url" className="text-sm font-medium">
              <ImageIcon className="mr-2 inline h-4 w-4" />
              Image URL or local path
            </label>
            <Input
              id="image_url"
              type="text"
              placeholder="https://example.com/image.jpg or /uploads/your-file.png"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="image" className="text-sm font-medium">
              <ImageIcon className="mr-2 inline h-4 w-4" />
              Re-upload Image
            </label>
            <ImagePicker
              max={4}
              initialFiles={imageFiles}
              initialPreviews={imagePreviews}
              initialUrls={formData.image_urls}
              onChange={(files, previews, urls, captions) => {                // Track remote URLs that were removed so we can delete them from storage
                const removed = initialRemoteUrlsRef.current.filter((u) => !urls.some((v) => normalizeUrl(u) === normalizeUrl(v)));
                // If user re-added a previously deleted file, remove it from deletedFiles
                setDeletedFiles((prev) => {
                  const filtered = prev.filter((u) => !urls.some((v) => normalizeUrl(u) === normalizeUrl(v)));
                  return Array.from(new Set([...filtered, ...removed]));
                });
                initialRemoteUrlsRef.current = urls.slice();
                setImageFiles(files);
                setImagePreviews(previews);
                setFormData((fd) => ({ ...fd, image_urls: urls, image_url: fd.image_url || urls[0] || previews[0] || '' }));
              }}
            />
            {deletedFiles && deletedFiles.length > 0 && (
              <div className="mt-2 rounded-md border p-2 bg-yellow-50 text-sm">
                <div className="font-medium">Images marked for deletion ({deletedFiles.length})</div>
                <ul className="list-disc ml-4 mt-1">
                  {deletedFiles.map((u, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="truncate">{u}</span>
                      <button type="button" className="text-xs text-primary underline" onClick={() => setDeletedFiles((prev) => prev.filter(x => x !== u))}>Undo</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="likes_count" className="text-sm font-medium">
                Likes Count
              </label>
              <Input
                id="likes_count"
                type="number"
                min="0"
                value={formData.likes_count}
                onChange={(e) => setFormData({ ...formData, likes_count: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="shares_count" className="text-sm font-medium">
                Shares Count
              </label>
              <Input
                id="shares_count"
                type="number"
                min="0"
                value={formData.shares_count}
                onChange={(e) => setFormData({ ...formData, shares_count: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Updating..." : "Update Activity"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import ImageLightbox from '@/components/admin/ImageLightbox';
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
import { normalizeEntities } from '@/lib/formatContent';

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
    video_url: activity.video_url || "",
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
    const removedPreview = imagePreviews[idx];
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    setFormData((fd) => {
      const remaining = (fd.image_urls || []).slice();
      return { ...fd, image_urls: remaining };
    });
    // If the preview corresponds to a remote url, mark it for deletion
    if (removedPreview && (formData.image_urls || []).some(u => normalizeUrl(u) === normalizeUrl(removedPreview))) {
      setDeletedFiles((prev) => Array.from(new Set([...prev, removedPreview])));
    }
  };

  const removeRemoteImage = (idx: number) => {
    const removedUrl = (formData.image_urls || [])[idx];
    setFormData((fd) => {
      const arr = (fd.image_urls || []).slice();
      arr.splice(idx, 1);
      let primary = fd.image_url;
      if (primary && removedUrl && primary === removedUrl) {
        primary = arr[0] || '';
      }
      return { ...fd, image_urls: arr, image_url: primary };
    });
    if (removedUrl) setDeletedFiles((prev) => Array.from(new Set([...prev, removedUrl])));
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
              const bodyText = await res.text().catch(() => null);
              console.error('Upload failed for file', file.name, 'status', res.status, bodyText);
              throw new Error(`Upload failed (${res.status})${bodyText ? ': ' + bodyText : ''}`);
            }
            const d = await res.json();
            console.log('Upload response:', d);
            if (!d?.url) throw new Error('Upload did not return a URL');
            return d.url;
          }));
          imageUrls.push(...uploads.filter(Boolean));
          if (imageUrls.length > 0) imageUrlToUse = imageUrls[0];
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr);
          // Surface the concrete error message instead of a generic one
          // and abort submission so no activity is created pointing to a non-existent file
          throw uploadErr;
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
      const payload = { id: activity.id, ...formData, image_url: imageUrlToUse, video_url: formData.video_url, content: normalizeEntities(contentToUse), title: normalizeEntities(formData.title || ''), activity_date: new Date(formData.activity_date).toISOString(), tags, delete_files: deletedFiles };
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Activity</CardTitle>
            <CardDescription>
              Update the activity details
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Clear
          </Button>
        </div>
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

            {/* Gallery preview for all images (image_urls + embedded images) */}
            {((imagePreviews || []).length > 0 || (formData.image_urls || []).length > 0) && (() => {
              const all = Array.from(new Set([...(imagePreviews || []), ...(formData.image_urls || [])]));
              const count = all.length;
              return (
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-2">Images in this post</div>

                  {/* 3-image special layout */}
                  {count === 3 ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-1 row-span-2 relative overflow-hidden rounded-md">
                        <img src={all[0]} alt="img-0" className="w-full h-full object-cover" onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }} />
                        {formData.image_url === all[0] && <span className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-0.5 rounded">Primary</span>}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button type="button" onClick={() => setPrimaryFromPreview(0)} className="bg-white/80 px-2 py-0.5 text-xs rounded">Primary</button>
                          <button type="button" onClick={() => { const pIndex = (imagePreviews || []).indexOf(all[0]); if (pIndex>=0) removePreview(pIndex); else { const rIndex=(formData.image_urls||[]).indexOf(all[0]); if(rIndex>=0) removeRemoteImage(rIndex);} }} className="bg-white/80 px-2 py-0.5 text-xs rounded">Remove</button>
                        </div>
                      </div>
                      <div className="col-span-1 grid grid-rows-2 gap-2">
                        <div className="relative overflow-hidden rounded-md">
                          <img src={all[1]} alt="img-1" className="w-full h-full object-cover" onClick={() => { setLightboxIndex(1); setLightboxOpen(true); }} />
                          {formData.image_url === all[1] && <span className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-0.5 rounded">Primary</span>}
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button type="button" onClick={() => setPrimaryFromRemote(0)} className="bg-white/80 px-2 py-0.5 text-xs rounded">Primary</button>
                            <button type="button" onClick={() => { const pIndex = (imagePreviews || []).indexOf(all[1]); if (pIndex>=0) removePreview(pIndex); else { const rIndex=(formData.image_urls||[]).indexOf(all[1]); if(rIndex>=0) removeRemoteImage(rIndex);} }} className="bg-white/80 px-2 py-0.5 text-xs rounded">Remove</button>
                          </div>
                        </div>
                        <div className="relative overflow-hidden rounded-md">
                          <img src={all[2]} alt="img-2" className="w-full h-full object-cover" onClick={() => { setLightboxIndex(2); setLightboxOpen(true); }} />
                          {formData.image_url === all[2] && <span className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-0.5 rounded">Primary</span>}
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button type="button" onClick={() => setPrimaryFromRemote(1)} className="bg-white/80 px-2 py-0.5 text-xs rounded">Primary</button>
                            <button type="button" onClick={() => { const pIndex = (imagePreviews || []).indexOf(all[2]); if (pIndex>=0) removePreview(pIndex); else { const rIndex=(formData.image_urls||[]).indexOf(all[2]); if(rIndex>=0) removeRemoteImage(rIndex);} }} className="bg-white/80 px-2 py-0.5 text-xs rounded">Remove</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`grid gap-2 ${count === 1 ? 'grid-cols-1' : count === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {all.map((src, idx) => (
                        <div key={idx} className="relative rounded overflow-hidden bg-gray-50">
                          <img src={src} alt={`preview-${idx}`} className="w-full h-32 object-cover cursor-pointer" onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }} />
                          <div className="absolute top-1 right-1 flex gap-1">
                            <button type="button" onClick={() => setPrimaryFromPreview(idx)} className="bg-white/80 px-2 py-0.5 text-xs rounded">Primary</button>
                            <button type="button" onClick={() => { const pIndex = (imagePreviews || []).indexOf(src); if (pIndex>=0) removePreview(pIndex); else { const rIndex=(formData.image_urls||[]).indexOf(src); if(rIndex>=0) removeRemoteImage(rIndex);} }} className="bg-white/80 px-2 py-0.5 text-xs rounded">Remove</button>
                          </div>
                          {formData.image_url === src && <span className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-0.5 rounded">Primary</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lightbox */}
                  {lightboxOpen && <ImageLightbox images={all} index={lightboxIndex} onClose={() => setLightboxOpen(false)} onPrev={() => setLightboxIndex(i => Math.max(0, i-1))} onNext={() => setLightboxIndex(i => Math.min(all.length-1, i+1))} />}

                </div>
              );
            })()}

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
            <label htmlFor="video_url" className="text-sm font-medium">
              🎥 Video URL
            </label>
            <Input
              id="video_url"
              type="text"
              placeholder="https://drive.google.com/file/d/.../view or https://twitter.com/.../status/... or YouTube URL"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Supported: Google Drive public links, Twitter/X video posts, YouTube videos
            </p>
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
              showPreviews={false}
              onChange={(files, previews, urls, captions) => {
                // Update local state - do not auto-mark images as deleted on change. Deletion is explicit via Remove.
                // If a previously-deleted remote URL is re-added, undo deletion.
                setDeletedFiles((prev) => prev.filter((u) => urls.some((v) => normalizeUrl(u) === normalizeUrl(v))));
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
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { extractHashtags } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Tag, Image as ImageIcon } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import ImagePicker from "@/components/admin/ImagePicker";
import ImageLightbox from '@/components/admin/ImageLightbox';

interface NewActivityFormProps {
  onSuccess?: () => void;
}

export default function NewActivityForm({ onSuccess }: NewActivityFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  interface FormState {
    title: string;
    content: string;
    location: string;
    type: string;
    activity_date: string;
    image_url: string;
    image_urls: string[];
    likes_count: number;
    shares_count: number;
  }

  const [formData, setFormData] = useState<FormState>({
    title: "",
    content: "",
    location: "",
    type: "",
    activity_date: new Date().toISOString().split('T')[0],
    image_url: "",
    image_urls: [], // Initialize as an empty array for multiple images
    likes_count: 0,
    shares_count: 0,
  });
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const DRAFT_KEY = 'activity_draft_v1';
  const DRAFTS_KEY = 'activity_drafts_v1';

  interface SavedDraft {
    id: string;
    title: string;
    formData: {
      title?: string;
      content?: string;
      location?: string;
      type?: string;
      activity_date?: string;
      image_url?: string;
    };
    image_urls?: string[];
    savedAt: number;
  }

  const [drafts, setDrafts] = useState<SavedDraft[]>([]);

  const isValidImageUrl = (val: string) => {
    if (!val) return true;
    if (val.startsWith('/')) return true;
    try {
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
    // limit to 4 images
    const limited = files.slice(0, 4);
    setImageFiles(limited);
    // generate previews
    Promise.all(limited.map((f) => new Promise<string>((res) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.readAsDataURL(f);
    }))).then((previews) => setImagePreviews(previews));
  };

  const addInputRef = useRef<HTMLInputElement | null>(null);


  // Append new images (called by the '+' hidden input)
  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // combine existing files with new ones, limit to 4 total
    const combinedFiles = [...imageFiles, ...files].slice(0, 4);

    // generate previews for combinedFiles; reuse existing previews when possible
    Promise.all(combinedFiles.map((f, i) => {
      // if we already have a preview for this index, reuse it
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

    // clear the input so same file can be re-selected later
    if (e.target) e.target.value = '';
  };

  // Prompt to add an external image URL and append up to 4
  const addImageUrlPrompt = () => {
    // Use modal UI instead of prompt (handled below)
    setShowImageUrlModal(true);
  };

  // Image URL modal state
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

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
      // if primary points to a data URL that was removed, clear it
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
      // if primary was this URL, clear or set to first
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

  // Save current form as a named draft (user prompted for a title)
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
          activity_date: formData.activity_date,
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
    // show any previously uploaded image URLs as previews
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
    // call handleSubmit with a fake event object that has preventDefault
    try {
      // @ts-ignore - synthetic event with preventDefault
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      // if publish succeeded, remove draft
      deleteDraft(id);
    } catch (e) {
      console.error('Publish draft failed', e);
      alert('Publish failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  // Autosave draft to localStorage (like blogspot)
  useEffect(() => {
    // Restore draft on mount
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setFormData((fd) => ({ ...fd, ...parsed.formData }));
          if (parsed.image_urls && Array.isArray(parsed.image_urls)) {
            // image URLs from previous uploads
            setFormData((fd) => ({ ...fd, image_url: parsed.image_urls[0] || fd.image_url }));
          }
          if (parsed.savedAt) setDraftSavedAt(parsed.savedAt);
        }
      }
      // load saved drafts list
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

  useEffect(() => {
    const save = () => {
      try {
        const payload = {
          formData: {
            title: formData.title,
            content: formData.content,
            location: formData.location,
            type: formData.type,
            activity_date: formData.activity_date,
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
  }, [formData.title, formData.content, formData.location, formData.type, formData.activity_date, formData.image_url, formData.image_urls]);

  function formatDraftAge(ts: number) {
    const diff = Date.now() - ts;
    if (diff < 5000) return 'just now';
    if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    return `${Math.round(diff / 3600000)}h ago`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: { user }, error: userGetError } = await supabase.auth.getUser();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Supabase auth.getUser error:', userGetError);
      console.log('Supabase auth.getUser user:', user);
      console.log('Supabase auth.getSession error:', sessionError);
      console.log('Supabase auth.getSession data:', sessionData);
      
      if (!user) {
        throw new Error("You must be logged in to create activities");
      }

      // Start with any image URLs already present (pasted or added via ImagePicker)
      const imageUrls: string[] = (formData.image_urls || []).slice();

      // Handle multiple file uploads if files were selected (limit to 4)
      if (imageFiles && imageFiles.length > 0) {
        const filesToUpload = imageFiles.slice(0, 4 - imageUrls.length);
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
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
      }


      // Build payload matching the current `activities` table schema
      const tags = extractHashtags(formData.content);

      // If multiple images uploaded, embed secondary images in content so feed shows them.
      let contentToInsert = formData.content || null;
      if (imageUrls.length > 1) {
        const extras = imageUrls.slice(1).map((u) => `\n\n${u}`);
        contentToInsert = (contentToInsert || '') + extras.join('');
      }

      const payload = {
        title: formData.title || null,
        content: contentToInsert || formData.content || null,
        location: formData.location || null,
        type: canonicalizeType(formData.type) || null,
        activity_date: new Date(formData.activity_date).toISOString(),
        // `activities` table has `image_url` (TEXT) not `image_urls` array
        image_url: imageUrls[0] || formData.image_url || null,
        tags: tags.length ? tags : null,
        likes_count: formData.likes_count || 0,
        shares_count: formData.shares_count || 0,
        author_id: user.id,
        author_name: 'Civic Admin',
      };

      // Preserve the full array of image URLs on the activity when present
      const finalImageUrls = [...(formData.image_urls || []), ...imageUrls].slice(0, 4);
      if (finalImageUrls.length > 0) (payload as any).image_urls = finalImageUrls;

      console.log('Insert Payload:', payload);

      // Use .select() to ask Supabase to return the inserted row and log full response
      const insertResult = await supabase
        .from('activities')
        .insert([payload])
        .select();

      console.log('Supabase Insert Result:', insertResult);

      // compat: some SDKs return { data, error }, others may return tuple - handle both
      const insertError = (insertResult as any).error || (Array.isArray(insertResult) && insertResult[1]) || null;
      if (insertError) {
        console.error('Supabase Insert Error:', insertError);
        throw insertError;
      }

      // If no detailed error but insertResult looks suspicious/empty, surface full response
      try {
        const looksEmpty = insertResult && typeof insertResult === 'object' && Object.keys(insertResult).length === 0;
        if (looksEmpty) {
          const full = JSON.stringify(insertResult, null, 2);
          console.error('Supabase Insert Result (full):', full);
          throw new Error(`Empty Supabase response:\n${full}`);
        }
      } catch (e) {
        // rethrow to be caught by outer try/catch
        throw e;
      }

      // Reset form
      setFormData({
        title: "",
        content: "",
        location: "",
        type: "",
        activity_date: new Date().toISOString().split('T')[0],
        image_url: "",
        image_urls: [], // Reset to empty array
        likes_count: 0,
        shares_count: 0,
      });
      setImageFiles([]);
      setImagePreviews([]);
      try { localStorage.removeItem(DRAFT_KEY); setDraftSavedAt(null); } catch (e) {}

      alert("Activity posted successfully!");
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('activity_types').select('name').order('name');
        if (error) {
          console.warn('Could not load activity types:', error.message);
          return;
        }
        if (mounted && Array.isArray(data)) setTypeOptions(data.map((r:any)=>r.name));
      } catch (e) {
        console.warn('Error fetching activity types', e);
      }
    })();
    return () => { mounted = false };
  }, [supabase]);

  const canonicalizeType = (chosen: string | null) => {
    if (!chosen) return null;
    if (typeOptions.includes(chosen)) return chosen;
    const lower = chosen.toLowerCase();
    if (typeOptions.includes(chosen + 's')) return chosen + 's';
    const found = typeOptions.find(t => t.toLowerCase().includes(lower) || lower.includes(t.toLowerCase()));
    if (found) return found;
    return chosen;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post New Activity</CardTitle>
        <CardDescription>
          Share an activity or event with the community
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
              placeholder="Describe the activity in detail... Use the toolbar to format text and add links. You can embed YouTube videos by pasting the video URL."
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
                {typeOptions.length > 0 ? (
                  typeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))
                ) : (
                  <>
                    <option value="Meeting">Meeting</option>
                    <option value="Protest">Protest</option>
                    <option value="Campaign">Campaign</option>
                    <option value="Plantation">Plantation</option>
                    <option value="News">News</option>
                    <option value="Other">Other</option>
                  </>
                )}
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
            <ImagePicker
              max={4}
              initialFiles={imageFiles}
              initialPreviews={imagePreviews}
              initialUrls={formData.image_urls}
              showPreviews={false}
              onChange={(files, previews, urls, captions) => {
                setImageFiles(files);
                setImagePreviews(previews);
                setFormData((fd) => ({ ...fd, image_urls: urls, image_url: fd.image_url || urls[0] || previews[0] || '' }));
              }}
            />

            {/* Gallery preview: show all selected and embedded images */}
            {((imagePreviews || []).length > 0 || (formData.image_urls || []).length > 0) && (() => {
              const all = Array.from(new Set([...(imagePreviews || []), ...(formData.image_urls || [])]));
              const count = all.length;
              return (
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-2">Images in this post</div>

                  {count === 3 ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-1 row-span-2 relative overflow-hidden rounded-md">
                        <img src={all[0]} alt="img-0" className="w-full h-full object-cover cursor-pointer" onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }} />
                        {formData.image_url === all[0] && <span className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-0.5 rounded">Primary</span>}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button type="button" onClick={() => setFormData(fd => ({ ...fd, image_url: all[0] }))} className="bg-white/80 px-2 py-0.5 text-xs rounded">Primary</button>
                          <button type="button" onClick={() => setFormData(fd => ({ ...fd, image_urls: (fd.image_urls || []).filter(u => u !== all[0]) }))} className="bg-white/80 px-2 py-0.5 text-xs rounded">Remove</button>
                        </div>
                      </div>
                      <div className="col-span-1 grid grid-rows-2 gap-2">
                        <div className="relative overflow-hidden rounded-md">
                          <img src={all[1]} alt="img-1" className="w-full h-full object-cover cursor-pointer" onClick={() => { setLightboxIndex(1); setLightboxOpen(true); }} />
                          {formData.image_url === all[1] && <span className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-0.5 rounded">Primary</span>}
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button type="button" onClick={() => setFormData(fd => ({ ...fd, image_url: all[1] }))} className="bg-white/80 px-2 py-0.5 text-xs rounded">Primary</button>
                            <button type="button" onClick={() => setFormData(fd => ({ ...fd, image_urls: (fd.image_urls || []).filter(u => u !== all[1]) }))} className="bg-white/80 px-2 py-0.5 text-xs rounded">Remove</button>
                          </div>
                        </div>
                        <div className="relative overflow-hidden rounded-md">
                          <img src={all[2]} alt="img-2" className="w-full h-full object-cover cursor-pointer" onClick={() => { setLightboxIndex(2); setLightboxOpen(true); }} />
                          {formData.image_url === all[2] && <span className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-0.5 rounded">Primary</span>}
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button type="button" onClick={() => setFormData(fd => ({ ...fd, image_url: all[2] }))} className="bg-white/80 px-2 py-0.5 text-xs rounded">Primary</button>
                            <button type="button" onClick={() => setFormData(fd => ({ ...fd, image_urls: (fd.image_urls || []).filter(u => u !== all[2]) }))} className="bg-white/80 px-2 py-0.5 text-xs rounded">Remove</button>
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
                            <button type="button" onClick={() => setFormData(fd => ({ ...fd, image_url: src }))} className="bg-white/80 px-2 py-0.5 text-xs rounded">Primary</button>
                            <button type="button" onClick={() => setFormData(fd => ({ ...fd, image_urls: (fd.image_urls || []).filter(u => u !== src) }))} className="bg-white/80 px-2 py-0.5 text-xs rounded">Remove</button>
                          </div>
                          {formData.image_url === src && <span className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-0.5 rounded">Primary</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {lightboxOpen && <ImageLightbox images={all} index={lightboxIndex} onClose={() => setLightboxOpen(false)} onPrev={() => setLightboxIndex(i => Math.max(0, i-1))} onNext={() => setLightboxIndex(i => Math.min(all.length-1, i+1))} />}

                </div>
              );
            })()}

          </div>

          <div className="space-y-2">
            <label htmlFor="image_url" className="text-sm font-medium">
              <ImageIcon className="mr-2 inline h-4 w-4" />
              Image URL or local path (optional)
            </label>
            <Input
              id="image_url"
              type="text"
              placeholder="https://example.com/image.jpg or /uploads/your-file.png"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="likes_count" className="text-sm font-medium">
                Initial Likes Count
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
                Initial Shares Count
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Posting..." : "Post Activity"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

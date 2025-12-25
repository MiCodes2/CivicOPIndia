"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { extractHashtags } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Tag, Image as ImageIcon } from "lucide-react";
import type { Activity } from "@/lib/types/database";
import RichTextEditor from "@/components/RichTextEditor";

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

  const [formData, setFormData] = useState({
    title: activity.title,
    content: activity.content || "",
    location: activity.location || "",
    type: activity.type || "",
    activity_date: new Date(activity.activity_date).toISOString().split('T')[0],
    image_url: activity.image_url || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // If user selected new files, upload them first and use the returned URLs
      let imageUrlToUse = formData.image_url;
      const imageUrls: string[] = [];
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

      // If multiple images uploaded, embed secondary images in content so feed shows them
      let contentToUse = formData.content || '';
      if (imageUrls.length > 1) {
        const extras = imageUrls.slice(1).map((u) => `\n\n${u}`);
        contentToUse = (contentToUse || '') + extras.join('');
      }

      // Use server-side admin update to bypass RLS (requires SUPABASE_SERVICE_ROLE_KEY)
      const tags = extractHashtags(contentToUse);
      const payload = { id: activity.id, ...formData, image_url: imageUrlToUse, content: contentToUse, activity_date: new Date(formData.activity_date).toISOString(), tags };
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
                <option value="Workshop">Workshop</option>
                <option value="Rally">Rally</option>
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
            <Input
              id="image"
              type="file"
              accept=".jfif,image/*"
              multiple
              onChange={handleImageChange}
            />
            {imagePreviews && imagePreviews.length > 0 && (
              <div className="mt-2 flex gap-2">
                {imagePreviews.map((p, idx) => (
                  <img key={idx} src={p} alt={`Preview ${idx+1}`} className="h-24 w-auto rounded-md object-cover" />
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Or paste image URL above</p>
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

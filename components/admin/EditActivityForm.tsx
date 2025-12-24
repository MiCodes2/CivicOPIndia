"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!isValidImageUrl(formData.image_url)) {
        setError('Image must be a valid absolute URL (https://...) or a local path beginning with /uploads/');
        setLoading(false);
        return;
      }
      // Use server-side admin update to bypass RLS (requires SUPABASE_SERVICE_ROLE_KEY)
      const payload = { id: activity.id, ...formData, activity_date: new Date(formData.activity_date).toISOString() };
      const res = await fetch('/api/admin/update-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || JSON.stringify(data));

      alert("Activity updated successfully!");
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
                <option value="Press Conference">Press Conference</option>
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

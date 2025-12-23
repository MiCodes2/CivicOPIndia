"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Tag, Image as ImageIcon } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

interface NewActivityFormProps {
  onSuccess?: () => void;
}

export default function NewActivityForm({ onSuccess }: NewActivityFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    location: "",
    type: "",
    activity_date: new Date().toISOString().split('T')[0],
    image_url: "",
    likes_count: 0,
    shares_count: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

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
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to create activities");
      }

      let finalImageUrl = formData.image_url;

      // Handle file upload if a file was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        // For now, we'll save to public/uploads and use the path
        // In production, you'd upload to Supabase Storage
        const formDataUpload = new FormData();
        formDataUpload.append('file', imageFile);
        
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });
          
          if (response.ok) {
            const data = await response.json();
            finalImageUrl = data.url;
          } else {
            // Fallback: use local path
            finalImageUrl = `/uploads/${fileName}`;
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          // Continue without image
          finalImageUrl = "";
        }
      }

      if (!isValidImageUrl(finalImageUrl)) {
        throw new Error('Image must be a valid absolute URL (https://...) or a local path beginning with /uploads/');
      }

      const { error: insertError } = await supabase
        .from('activities')
        .insert([
          {
            ...formData,
            image_url: finalImageUrl,
            author_id: user.id,
            author_name: 'Civic Admin',
            activity_date: new Date(formData.activity_date).toISOString(),
          }
        ]);

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        title: "",
        content: "",
        location: "",
        type: "",
        activity_date: new Date().toISOString().split('T')[0],
        image_url: "",
        likes_count: 0,
        shares_count: 0,
      });
      setImageFile(null);
      setImagePreview("");

      alert("Activity posted successfully!");
      if (onSuccess) onSuccess();
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
            <label htmlFor="image" className="text-sm font-medium">
              <ImageIcon className="mr-2 inline h-4 w-4" />
              Upload Image
            </label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="mt-2">
                <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-md object-cover" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Or paste image URL below
            </p>
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Posting..." : "Post Activity"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

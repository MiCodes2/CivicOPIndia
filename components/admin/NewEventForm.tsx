"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Tag, Image as ImageIcon } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

interface NewEventFormProps {
  onSuccess?: () => void;
}

const EVENT_TYPES = [
  "Protest",
  "Tree Plantation",
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

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    location: "",
    event_date: new Date().toISOString().split("T")[0],
    image_url: "",
    type: EVENT_TYPES[0],
  });

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

      // Insert into the dedicated `events` table
      const insertResult = await supabase.from('events').insert([payload]).select();
      const insertError = (insertResult as any).error || (Array.isArray(insertResult) && insertResult[1]) || null;
      if (insertError) throw insertError;

      setFormData({ title: "", content: "", location: "", event_date: new Date().toISOString().split('T')[0], image_url: "", type: EVENT_TYPES[0] });
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
        <CardDescription>Standard events like Protest, Tree Plantation, Cleanliness Drive</CardDescription>
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
            <label className="text-sm font-medium"><ImageIcon className="mr-2 inline h-4 w-4"/> Image URL (optional)</label>
            <Input value={formData.image_url} onChange={(e)=>setFormData({...formData, image_url: e.target.value})} />
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Event'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

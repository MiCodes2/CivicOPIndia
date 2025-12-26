"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateShort } from '@/lib/utils';
import NewActivityForm from "@/components/admin/NewActivityForm";
import NewEventForm from "@/components/admin/NewEventForm";
import EditActivityForm from "@/components/admin/EditActivityForm";
import EditEventForm from "@/components/admin/EditEventForm";
import { LogOut, Activity as ActivityIcon, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

import type { Activity } from "@/lib/types/database";

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    loadActivities();
    loadEvents();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
      } else {
        setUser(user);
      }
    } catch (err:any) {
      console.warn('Supabase getUser failed in admin dashboard:', err?.message || err);
      try { await supabase.auth.signOut(); } catch (e) {}
      try { localStorage.removeItem('civic-op-auth'); } catch (e) {}
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setActivities(data);
    }
  };

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });
    if (data) setEvents(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this activity?")) {
      return;
    }
    try {
      const res = await fetch('/api/admin/delete-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || JSON.stringify(data));
      alert("Activity deleted successfully!");
      loadActivities();
    } catch (e:any) {
      alert('Failed to delete activity: ' + (e.message || String(e)));
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch('/api/admin/delete-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || JSON.stringify(data));
      alert('Event deleted successfully!');
      loadEvents();
    } catch (e:any) {
      alert('Failed to delete event: ' + (e.message || String(e)));
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Logged in as {user.email}
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/activities">
              <ActivityIcon className="mr-2 h-4 w-4" />
              View Public Feed
            </Link>
          </Button>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>


      <div className="grid gap-8 lg:grid-cols-3">
        {/* Post/Edit Form */}
        <div className="lg:col-span-2">
          {editingActivity ? (
            <EditActivityForm
              activity={editingActivity}
              onCancel={() => setEditingActivity(null)}
              onSuccess={() => {
                setEditingActivity(null);
                loadActivities();
              }}
            />
          ) : editingEvent ? (
            <EditEventForm
              event={editingEvent}
              onCancel={() => setEditingEvent(null)}
              onSuccess={() => { setEditingEvent(null); loadEvents(); }}
            />
          ) : (
            <>
              <NewActivityForm onSuccess={loadActivities} />
              <div className="mt-6">
                <NewEventForm onSuccess={loadEvents} />
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Activities</span>
                <span className="font-bold">{activities.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Events</span>
                <span className="font-bold">{events.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account</span>
                <span className="font-bold">Admin</span>
              </div>
            </CardContent>
          </Card>

          {/* All Activities */}
          <Card>
            <CardHeader>
              <CardTitle>All Activities</CardTitle>
              <CardDescription>Manage your posts</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {/* Group activities by month for easier management */}
                  {(() => {
                    const groups: Record<string, typeof activities> = {};
                    for (const a of activities) {
                      const d = new Date(a.activity_date || a.created_at || '');
                      if (isNaN(d.getTime())) continue;
                      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(a);
                    }
                    const keys = Object.keys(groups).sort((a,b)=> b.localeCompare(a));
                    return keys.map((k) => {
                      const [yr, mo] = k.split('-');
                      const label = new Date(Number(yr), Number(mo)-1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
                      return (
                        <div key={k} className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="text-sm font-medium">{label}</div>
                              <div className="text-xs text-muted-foreground">{groups[k].length} post{groups[k].length !== 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {groups[k].map((activity) => (
                              <div key={activity.id} className="rounded-lg border p-3 text-sm">
                                <div className="font-medium">{activity.title}</div>
                                <div className="mt-1 text-xs text-muted-foreground">{formatDateShort(activity.activity_date)}</div>
                                <div className="mt-2 flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => setEditingActivity(activity)}>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDelete(activity.id)}>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No activities yet. Create your first post!
                </p>
              )}
            </CardContent>
          </Card>

          {/* All Events */}
          <Card>
            <CardHeader>
              <CardTitle>All Events</CardTitle>
              <CardDescription>Manage events (create, edit, delete)</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {(() => {
                    const groups: Record<string, typeof events> = {};
                    for (const e of events) {
                      const d = new Date(e.event_date || e.created_at || '');
                      if (isNaN(d.getTime())) continue;
                      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(e);
                    }
                    const keys = Object.keys(groups).sort((a,b)=> b.localeCompare(a));
                    return keys.map((k) => {
                      const [yr, mo] = k.split('-');
                      const label = new Date(Number(yr), Number(mo)-1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
                      return (
                        <div key={k} className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="text-sm font-medium">{label}</div>
                              <div className="text-xs text-muted-foreground">{groups[k].length} event{groups[k].length !== 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {groups[k].map((ev) => (
                              <div key={ev.id} className="rounded-lg border p-3 text-sm">
                                <div className="font-medium">{ev.title}</div>
                                <div className="mt-1 text-xs text-muted-foreground">{formatDateShort(ev.event_date)}</div>
                                <div className="mt-2 flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => setEditingEvent(ev)}>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(ev.id)}>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No events yet. Create your first event!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

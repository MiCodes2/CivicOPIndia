import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NewActivityForm from "@/components/admin/NewActivityForm";
import { LogOut, Activity as ActivityIcon } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Fetch recent activities
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

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
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Post Form */}
        <div className="lg:col-span-2">
          <NewActivityForm />
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
                <span className="font-bold">{activities?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account</span>
                <span className="font-bold">Admin</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>Your latest activities</CardDescription>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-lg border p-3 text-sm hover:bg-muted/50"
                    >
                      <div className="font-medium">{activity.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(activity.activity_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No activities yet. Create your first post!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Activity as ActivityIcon, Users, Megaphone, FileText } from "lucide-react";
import ActivityFeedCard from "@/components/ActivityFeedCard";
import type { Activity } from "@/lib/types/database";

export const revalidate = 0; // Always fetch fresh data

export default async function ActivitiesPage() {
  const supabase = await createClient();
  
  // Fetch activities from Supabase ordered by activity_date
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .order('activity_date', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-bold tracking-tight">Daily Activities</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Stay updated with our latest actions, protests, and community initiatives.
          Join us in building a more accountable democracy.
        </p>
      </div>

      {/* Activity Types Info */}
      <div className="mb-12 grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <Users className="h-8 w-8 text-primary" />
            <CardTitle className="text-lg">Meetings</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <FileText className="h-8 w-8 text-primary" />
            <CardTitle className="text-lg">Campaigns</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <Megaphone className="h-8 w-8 text-primary" />
            <CardTitle className="text-lg">Protests</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <ActivityIcon className="h-8 w-8 text-primary" />
            <CardTitle className="text-lg">Workshops</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {error && (
        <Card className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-900 dark:text-yellow-100">
              Database Connection Required
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Add your Supabase credentials to .env.local to see live activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Error: {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Activities Feed */}
      {activities && activities.length > 0 ? (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Activity Feed</h2>
            <p className="text-muted-foreground">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'} posted
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {activities.map((activity) => (
              <ActivityFeedCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ) : (
        !error && (
          <Card>
            <CardHeader>
              <CardTitle>No Activities Yet</CardTitle>
              <CardDescription>
                Activities will appear here once they're posted by the admin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Check back soon for updates on our latest actions and initiatives!
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

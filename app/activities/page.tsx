import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Activity as ActivityIcon, MapPin, Calendar } from "lucide-react";
import type { Activity } from "@/lib/types/database";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ActivitiesPage() {
  const supabase = await createClient();
  
  // Fetch activities from Supabase
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Daily Activities</h1>
        <p className="mt-2 text-muted-foreground">
          Stay updated with our latest actions, protests, and community initiatives
        </p>
      </div>

      {error && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-900 dark:text-yellow-100">
              Database Connection Required
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Add your Supabase credentials to .env.local to see activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Error: {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {!error && (!activities || activities.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No Activities Yet</CardTitle>
            <CardDescription>
              Activities will appear here once they're added to your database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Once configured, this page will display real-time updates about protests,
              meetings, policy discussions, and community actions.
            </p>
          </CardContent>
        </Card>
      )}

      {activities && activities.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity: Activity) => (
            <Card key={activity.id} className="flex flex-col">
              {activity.image_url && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={activity.image_url}
                    alt={activity.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2">{activity.title}</CardTitle>
                  <ActivityIcon className="h-5 w-5 shrink-0 text-primary" />
                </div>
                <CardDescription className="flex items-center gap-4 text-xs">
                  {activity.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(activity.created_at).toLocaleDateString('en-IN')}
                    </span>
                  )}
                  {activity.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {activity.location}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              {activity.content && (
                <CardContent className="flex-1">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {activity.content}
                  </p>
                </CardContent>
              )}
              {activity.tags && activity.tags.length > 0 && (
                <CardContent className="border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    {activity.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

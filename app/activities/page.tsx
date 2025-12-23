import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Activity as ActivityIcon, MapPin, Calendar, Users, Megaphone, FileText } from "lucide-react";
import type { Activity } from "@/lib/types/database";

export const revalidate = 60; // Revalidate every 60 seconds

// Sample activities for demonstration (will be replaced by database data)
const sampleActivities = [
  {
    id: 1,
    title: "Community Town Hall - Healthcare Access",
    description: "Public meeting to discuss healthcare accessibility issues in rural areas. Join us to voice your concerns and suggest solutions for better healthcare infrastructure.",
    location: "Community Center, Delhi",
    date: "2025-12-25",
    type: "Meeting",
    icon: Users,
  },
  {
    id: 2,
    title: "RTI Campaign - Education Funding",
    description: "Filing RTI requests to investigate allocation and utilization of education funds. Help us uncover discrepancies and demand accountability in education spending.",
    location: "Online",
    date: "2025-12-26",
    type: "Campaign",
    icon: FileText,
  },
  {
    id: 3,
    title: "Peaceful Protest - Environmental Justice",
    description: "Demonstration against illegal deforestation and demanding stricter enforcement of environmental protection laws. Bring your voice to demand climate action.",
    location: "Central Park, Mumbai",
    date: "2025-12-28",
    type: "Protest",
    icon: Megaphone,
  },
  {
    id: 4,
    title: "Legal Awareness Workshop",
    description: "Free workshop on citizens' legal rights, RTI procedures, and how to file complaints against government negligence. Expert lawyers will guide participants.",
    location: "Law College, Bangalore",
    date: "2025-12-30",
    type: "Workshop",
    icon: ActivityIcon,
  },
  {
    id: 5,
    title: "Anti-Corruption Rally",
    description: "Mass rally demanding transparent governance and stronger anti-corruption measures. March with us to demand accountability from elected officials.",
    location: "India Gate, Delhi",
    date: "2026-01-02",
    type: "Rally",
    icon: Megaphone,
  },
];

export default async function ActivitiesPage() {
  const supabase = await createClient();
  
  // Fetch activities from Supabase
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  // Use database activities if available, otherwise show sample activities
  const displayActivities = activities && activities.length > 0 ? activities : null;

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

      {/* Sample Activities */}
      {!displayActivities && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Upcoming Events</h2>
            <p className="text-muted-foreground">Join us in these activities to make your voice heard</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {sampleActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <Card key={activity.id} className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-10 w-10 text-primary" />
                        <div>
                          <CardTitle className="text-xl">{activity.title}</CardTitle>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                              {activity.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4 text-base">
                      {activity.description}
                    </CardDescription>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(activity.date).toLocaleDateString('en-IN', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{activity.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
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

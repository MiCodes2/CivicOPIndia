import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Activity as ActivityIcon, Users, Megaphone, FileText } from "lucide-react";
import ActivityFeedCard from "@/components/ActivityFeedCard";
import ActivityTypeManager from "@/components/ActivityTypeManager";
import ActivitiesClientList from "@/components/ActivitiesClientList";
import type { Activity } from "@/lib/types/database";

import Link from "next/link";

export const revalidate = 0; // Always fetch fresh data

export default async function ActivitiesPage({ searchParams }: { searchParams?: { type?: string } | Promise<{ type?: string }> }) {
  const supabase = await createClient();
  let params = searchParams;
  if (typeof searchParams === 'object' && typeof (searchParams as Promise<any>).then === 'function') {
    params = await (searchParams as Promise<any>);
  }
  const selectedType = params?.type || undefined;

  // Fetch activity types (lookup table)
  const { data: typeRows } = await supabase.from('activity_types').select('name').order('name');

  // Fetch activities from Supabase ordered by activity_date; optionally filter by type
  let query = supabase.from('activities').select('*').order('activity_date', { ascending: false });
  if (selectedType) query = query.eq('type', selectedType);
  const { data: activities, error } = await query;

  // Build counts and distinct types from fetched activities
  const activitiesList: Activity[] = activities || [];

  // Build canonical mapping using activity_types lookup to dedupe UI entries
  const canonicalNames: string[] = (typeRows || []).map((r: any) => r.name);

  const canonicalize = (raw?: string) => {
    const s = (raw || '').toString().trim();
    if (!s) return 'Other';
    // exact match
    const exact = canonicalNames.find((c) => c === s);
    if (exact) return exact;
    const lower = s.toLowerCase();
    // try plural/singular and substring matches
    const fuzzy = canonicalNames.find((c) => {
      const cl = c.toLowerCase();
      if (cl === lower) return true;
      if (cl.endsWith('s') && cl.slice(0, -1) === lower) return true;
      if (lower.endsWith('s') && lower.slice(0, -1) === cl) return true;
      if (lower.includes(cl) || cl.includes(lower)) return true;
      return false;
    });
    return fuzzy || 'Other';
  };

  const countsByType: Record<string, number> = {};
  // initialize with canonical names so UI order is stable
  canonicalNames.forEach((n) => (countsByType[n] = 0));
  activitiesList.forEach((a) => {
    const key = canonicalize(a.type || 'Other');
    countsByType[key] = (countsByType[key] || 0) + 1;
  });

  // Suggested grouping: Drive (cleanliness + encroachment variants), Tree Plantation
  const normalize = (s?: string) => (s || '').toLowerCase().trim();
  const driveKeys = new Set(['cleanliness drive', 'encroachment clearance', 'encroachment removal', 'encroachment']);
  const treeKeys = new Set(['tree plantation', 'treeplantation', 'tree-plantation']);

  let driveCount = 0;
  let treeCount = 0;
  Object.entries(countsByType).forEach(([k, v]) => {
    const nk = normalize(k).replace(/s$/,'');
    if (driveKeys.has(nk) || nk.includes('encroachment')) driveCount += v;
    if (treeKeys.has(nk) || nk.includes('tree')) treeCount += v;
  });

  // Check current user/profile to decide whether to show admin manager
  let showAdminManager = false;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = (userData as any)?.user;
    if (user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile && (profile as any).role === 'admin') showAdminManager = true;
    }
  } catch {
    // ignore errors — default to not showing
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-bold tracking-tight">Daily Activities</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Stay updated with our latest actions, protests, and community initiatives.
          Join us in building a more accountable democracy.
        </p>
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

      
      {activities && activities.length > 0 ? (
        <ActivitiesClientList activities={activitiesList} types={(typeRows||[]).map((r:any)=>r.name)} initialSelected={selectedType || null} />
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

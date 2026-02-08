import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pageMetadata } from '@/lib/pageMetadata'
import { createClient } from "@/lib/supabase/server";
import { Activity as ActivityIcon, Users, Megaphone, FileText } from "lucide-react";
import ActivityFeedCard from "@/components/ActivityFeedCard";
import ActivityTypeManager from "@/components/ActivityTypeManager";
import ActivitiesClientList from "@/components/ActivitiesClientList";
import type { Activity } from "@/lib/types/database";

import Link from "next/link";
import { extractHashtags } from '@/lib/utils';

export const revalidate = 0; // Always fetch fresh data

export default async function ActivitiesPage({ searchParams }: { searchParams?: { type?: string } | Promise<{ type?: string }> }) {
  const supabase = await createClient();
  let paramsObj: { type?: string } | undefined;
  if (searchParams && typeof (searchParams as any).then === 'function') {
    paramsObj = await (searchParams as Promise<any>);
  } else {
    paramsObj = searchParams as any;
  }
  let selectedType = paramsObj?.type || undefined;
  const selectedTag = (paramsObj as any)?.tag || undefined;

  // Fetch activity types (lookup table)
  const { data: typeRows } = await supabase.from('activity_types').select('name').order('name');

  const canonicalNames: string[] = (typeRows || []).map((r: any) => r.name);

  const canonicalize = (raw?: string | null) => {
    const s = (raw || '').toString().trim();
    if (!s) return 'Other';
    if (!canonicalNames.length) return s;
    const exact = canonicalNames.find((c) => c === s);
    if (exact) return exact;
    const lower = s.toLowerCase();
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

  if (selectedType) {
    selectedType = canonicalize(selectedType);
  }

  // Fetch activities from Supabase ordered by activity_date
  let query = supabase.from('activities').select('*').order('activity_date', { ascending: false });
  const { data: activities, error } = await query;

  // Build counts and distinct types from fetched activities
  let activitiesList: Activity[] = (activities || []).map((activity) => {
    const normalizedType = canonicalize(activity.type || '');
    if ((activity.type || 'Other') === normalizedType) return activity;
    return { ...activity, type: normalizedType };
  });

  // Apply in-memory filters (type/tag) for cases where tags may be in content only
  if (selectedType) activitiesList = activitiesList.filter(a => ((a.type||'') === selectedType));
  if (selectedTag) {
    const st = selectedTag.toLowerCase();
    activitiesList = activitiesList.filter(a => {
      const tags = (a.tags || []).map((t:any)=>String(t).toLowerCase());
      if (tags.includes(st)) return true;
      const extracted = extractHashtags(a.content || '');
      return extracted.includes(st);
    });
  }

  // Build canonical mapping using activity_types lookup to dedupe UI entries
  const countsByType: Record<string, number> = {};
  // initialize with canonical names so UI order is stable
  canonicalNames.forEach((n) => (countsByType[n] = 0));
  activitiesList.forEach((a) => {
    const key = canonicalize(a.type || 'Other');
    countsByType[key] = (countsByType[key] || 0) + 1;
  });

  // Suggested grouping: Drive (cleanliness + encroachment variants), Plantation
  const normalize = (s?: string) => (s || '').toLowerCase().trim();
  const driveKeys = new Set(['cleanliness drive', 'encroachment clearance', 'encroachment removal', 'encroachment']);
  const treeKeys = new Set(['plantation','tree plantation', 'treeplantation', 'tree-plantation']);

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
    <div className="mx-auto px-0 md:px-4 pt-1 pb-3 max-w-7xl">
        <div className="py-2 px-4 md:px-0">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight">Daily Activities</h1>

        {/* Mobile: type filter buttons replacing description */}
        <div className="mt-2 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link href="/activities" aria-current={!selectedType ? 'true' : undefined} className={`px-3 py-1 rounded ${!selectedType ? 'bg-primary text-white' : 'bg-gray-100'}`}>All</Link>
            {((typeRows||[]).map((r:any)=>r.name)).map((t:any) => (
              <Link key={t} href={`/activities?type=${encodeURIComponent(t)}`} aria-current={selectedType === t ? 'true' : undefined} className={`px-3 py-1 rounded ${selectedType === t ? 'bg-primary text-white' : 'bg-gray-100'}`}>{t}</Link>
            ))}
          </div>
        </div>

        <p className="mt-2 text-base sm:text-lg text-muted-foreground hidden md:block">
          Stay updated with our latest actions, protests, and community initiatives. Join us in building a more accountable democracy.
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
        // three-column layout: left types, center feed, right trending tags
        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Categories</CardTitle>
                  <CardDescription className="text-sm">Explore activities by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li>
                      <a href="/activities" className={`block px-3 py-1 rounded ${!selectedType ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>All</a>
                    </li>
                    {((typeRows||[]).map((r:any)=>r.name)).map((t:any) => (
                      <li key={t}>
                        <a href={`/activities?type=${encodeURIComponent(t)}`} className="block px-3 py-1 rounded hover:bg-gray-100">{t}</a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-primary flex items-center gap-2">
                    <span className="animate-pulse">📢</span>
                    Citizens Issue Box
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-primary/80">
                    Your voice matters - we will share with relevant authorities
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                    <Link href="https://app.civicopindia.com/?report=true" className="flex items-center justify-center">
                      Report Issue Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>

          <main className="lg:col-span-2">
            <ActivitiesClientList activities={activitiesList} types={(typeRows||[]).map((r:any)=>r.name)} initialSelected={selectedType || null} />
          </main>

          <aside className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Trending</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(() => {
                    const tagCounts: Record<string, number> = {};
                    // Use all fetched activities (global) to compute trending hashtags
                    (activities || []).forEach((a:any) => {
                      const tags = (a.tags && a.tags.length) ? a.tags.map((t:string)=>String(t).toLowerCase()) : extractHashtags(a.content || '');
                      (tags || []).forEach((tg:string) => { if (!tg) return; tagCounts[tg] = (tagCounts[tg] || 0) + 1; });
                    });
                    return Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).slice(0,8).map(([tag,count]) => (
                      <li key={tag}>
                        <a href={`/activities?tag=${encodeURIComponent(tag)}`} className="block px-3 py-1 rounded hover:bg-gray-100"><span className="text-primary font-medium">#{tag}</span></a>
                      </li>
                    ));
                  })()}
                </ul>
              </CardContent>
            </Card>
          </aside>
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

export const metadata = pageMetadata.activities

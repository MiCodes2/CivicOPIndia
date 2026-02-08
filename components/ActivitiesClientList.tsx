"use client";

import React, { useMemo, useState } from "react";
import ActivityFeedCard from "@/components/ActivityFeedCard";
import type { Activity } from "@/lib/types/database";

interface Props {
  activities: Activity[];
  types?: string[];
  initialSelected?: string | null;
}

const compareActivities = (a: Activity, b: Activity) => {
  const getTime = (raw?: string | null) => (raw ? new Date(raw).getTime() : 0);

  if (a.is_pinned && b.is_pinned) {
    return getTime(b.pinned_at || b.activity_date) - getTime(a.pinned_at || a.activity_date);
  }
  if (a.is_pinned) return -1;
  if (b.is_pinned) return 1;

  if (a.is_highlighted && b.is_highlighted) {
    return getTime(b.highlighted_at || b.activity_date) - getTime(a.highlighted_at || a.activity_date);
  }
  if (a.is_highlighted) return -1;
  if (b.is_highlighted) return 1;

  return getTime(b.activity_date) - getTime(a.activity_date);
};

export default function ActivitiesClientList({ activities, initialSelected = null }: Props) {
  const [selected, setSelected] = useState<string | null>(initialSelected || null);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const sortedActivities = useMemo(() => {
    if (!activities?.length) return [];
    return [...activities].sort(compareActivities);
  }, [activities]);

  const filtered = useMemo(() => {
    if (!selected) return sortedActivities;
    return sortedActivities.filter((a) => (a.type || 'Other') === selected);
  }, [sortedActivities, selected]);

  // visibleCount controls how many posts to show; supports 'Load more' pagination
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  // sync URL when filter changes (pushState)
  React.useEffect(() => {
    try {
      const url = selected ? `/activities?type=${encodeURIComponent(selected)}` : '/activities';
      if (window && window.history && window.history.pushState) {
        window.history.pushState({}, '', url);
      }
    } catch {
      // ignore
    }
  }, [selected]);

  React.useEffect(() => {
    try {
      // If there's a hash like #activity-123, scroll to it
      const h = window.location.hash;
      if (h && h.startsWith('#activity-')) {
        const el = document.getElementById(h.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch {}
  }, []);

  return (
    <div className="w-full">
      {filtered.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-8">No activities found.</div>
      )}

      <div className="w-full">
        {visible.map(act => (
          <div id={`activity-${act.id}`} key={act.id} className="w-full"><ActivityFeedCard activity={act} /></div>
        ))}
      </div>

      {filtered.length > visibleCount && (
        <div className="my-6">
          <button className="rounded bg-primary px-4 py-2 text-white" onClick={() => setVisibleCount((c) => c + 10)}>Load more</button>
        </div>
      )}
    </div>
  );
}

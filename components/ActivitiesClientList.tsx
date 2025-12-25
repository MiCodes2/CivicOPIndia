"use client";

import React, { useMemo, useState } from "react";
import ActivityFeedCard from "@/components/ActivityFeedCard";
import type { Activity } from "@/lib/types/database";

interface Props {
  activities: Activity[];
  types?: string[];
  initialSelected?: string | null;
}

export default function ActivitiesClientList({ activities, types = [], initialSelected = null }: Props) {
  const [selected, setSelected] = useState<string | null>(initialSelected || null);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach((a) => {
      const t = (a.type || 'Other').toString();
      map[t] = (map[t] || 0) + 1;
    });
    return map;
  }, [activities]);

  const filtered = useMemo(() => {
    if (!selected) return activities;
    return activities.filter(a => (a.type || 'Other') === selected);
  }, [activities, selected]);

  // visibleCount controls how many posts to show; supports 'Load more' pagination
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const displayTypes = types && types.length ? types : Array.from(new Set(activities.map(a=> (a.type||'Other').toString())));

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
    <div className="flex flex-col items-center w-full">
      {filtered.length === 0 && (
        <div className="text-sm text-muted-foreground">No activities found.</div>
      )}

      <div className="flex flex-col items-center w-full">
        {visible.map(act => (
          <div id={`activity-${act.id}`} key={act.id}><ActivityFeedCard activity={act} /></div>
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

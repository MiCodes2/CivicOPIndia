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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelected(null)}
          className={`inline-flex items-center gap-2 rounded px-3 py-1 ${selected===null ? 'bg-primary text-white shadow' : 'border'}`}
        >
          All ({activities.length})
        </button>
        {displayTypes.map(t => (
          <button
            key={t}
            onClick={() => setSelected(prev => prev === t ? null : t)}
            className={`inline-flex items-center gap-2 rounded px-3 py-1 ${selected===t ? 'bg-primary text-white shadow' : 'border'}`}
          >
            {t} {counts[t] ? `(${counts[t]})` : ''}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {filtered.map(act => (
          <ActivityFeedCard key={act.id} activity={act} />
        ))}
      </div>
    </div>
  );
}

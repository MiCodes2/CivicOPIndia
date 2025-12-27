"use client";

import { useState, useEffect } from "react";

interface StatItem {
  value: string;
  label: string;
  dynamic?: boolean;
  api?: string;
}

interface StatsSectionProps {
  initialStats: StatItem[];
}

export default function StatsSection({ initialStats }: StatsSectionProps) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    // Fetch dynamic follower count
    const dynamicStat = stats.find(s => s.dynamic);
    if (dynamicStat && dynamicStat.api) {
      fetch(dynamicStat.api)
        .then(r => r.json())
        .then(data => {
          if (data && data.followers) {
            setStats(prev => prev.map(stat =>
              stat.dynamic ? { ...stat, value: data.followers } : stat
            ));
          }
        })
        .catch(() => {
          // Keep fallback value if API fails
        });
    }
  }, []);

  return (
    <section className="border-b bg-card py-16">
      <div className="container mx-auto px-3">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-primary">{stat.value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
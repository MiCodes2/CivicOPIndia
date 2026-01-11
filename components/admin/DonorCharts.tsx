"use client";

import 'chart.js/auto';
import { Bar, Line } from 'react-chartjs-2';
import { useMemo } from 'react';

export default function DonorCharts({ cities, dailyTotals, days = 30 }: { cities: Array<{ city: string; donor_count: number; total_in_inr: number }>; dailyTotals?: Array<{ day: string; donor_count: number; total_in_inr: number }>; days?: number }) {
  const cityData = useMemo(() => {
    const labels = cities.map(c => c.city);
    const values = cities.map(c => c.total_in_inr);
    return {
      labels,
      datasets: [
        {
          label: 'Total (INR)',
          data: values,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [cities]);

  const timeSeriesData = useMemo(() => {
    // If dailyTotals provided by server, use them. Otherwise fall back to an empty series.
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const map: Record<string, number> = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }

    if (dailyTotals && dailyTotals.length) {
      dailyTotals.forEach(dt => {
        const k = new Date(dt.day).toISOString().slice(0, 10);
        if (k in map) map[k] = Number(dt.total_in_inr || 0);
      });
    }

    const labels = Object.keys(map).sort();
    const values = labels.map(l => map[l]);

    return {
      labels,
      datasets: [
        {
          label: 'Raised (INR)',
          data: values,
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderColor: 'rgba(16, 185, 129, 1)',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [dailyTotals, days]);

  const barOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { callback: (v: any) => Number(v).toLocaleString() } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.x.toLocaleString()}`,
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: { ticks: { callback: (v: any) => Number(v).toLocaleString() } },
    },
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="bg-white rounded-lg p-4 shadow-sm flex-1 flex flex-col">
        <div className="text-sm text-muted-foreground mb-2">Top Cities (by amount)</div>
        <div className="flex-1">
          <Bar data={cityData} options={{ ...barOptions, maintainAspectRatio: false }} />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm flex-1 flex flex-col">
        <div className="text-sm text-muted-foreground mb-2">Donations (last {days} days)</div>
        <div className="flex-1">
          <Line data={timeSeriesData} options={{ ...lineOptions, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ChartClient = dynamic(() => import('./ChartClient'), { ssr: false, loading: () => <div className="text-sm text-muted-foreground">Loading chart…</div> });

export default function MetricsChart({ days = 30 }: { days?: number }) {
  const [rangeDays, setRangeDays] = useState<number>(days);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [LineComp, setLineComp] = useState<any>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        // Attempt to include the user's access token so server can authenticate (fallback if cookies aren't present)
        let headers: any = {};
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          try {
            const s = await supabase.auth.getSession();
            const token = s?.data?.session?.access_token ?? null;
            if (token) headers['Authorization'] = `Bearer ${token}`;
          } catch (e) {
            // ignore
          }
        } catch (e) {
          // ignore import failures
        }

        const resp = await fetch(`/api/admin/metrics?days=${rangeDays}`, { headers, credentials: 'same-origin' });
        const json = await resp.json().catch(() => ({ error: 'invalid_json' }));
        if (!mounted) return;
        if (json.error) {
          // Dev-time debug: print response details to console to help diagnose auth/data issues
          if (process.env.NODE_ENV !== 'production') {
            console.debug('Metrics API returned error', { status: resp.status, body: json });
          }
          setData({ error: json.error, debug: json.debug, status: resp.status });
        } else {
          setData(json);
        }
      } catch (e) {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false };
  }, [rangeDays]);

  // Lazy-load Chart.js only on client to avoid build-time missing-module errors
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Use computed module strings to avoid static resolution during build-time
        const chartAuto = 'chart.js/auto';
        const chartLib = 'react-chartjs-2';

        // Chart.js auto-registers when imported; use indirect dynamic import via Function
        // to prevent bundlers from statically resolving the module at build time.
        // @ts-ignore
        await new Function('m', 'return import(m)')(chartAuto);
        // @ts-ignore
        const mod = await new Function('m', 'return import(m)')(chartLib);
        if (!mounted) return;
        // Support multiple module shapes: named export Line, default export with Line, or default being the component
        const candidate = mod.Line || (mod.default && (mod.default.Line || mod.default)) || mod.default || mod;
        setLineComp(() => candidate);
        if (process.env.NODE_ENV !== 'production') console.debug('Chart import succeeded', { mod });
      } catch (e: any) {
        console.warn('Chart import failed:', e?.message || e);
        if (mounted) {
          const msg = e?.message || String(e);
          setChartError(process.env.NODE_ENV !== 'production' ? `Chart import failed: ${msg}. Try running \`pnpm install chart.js react-chartjs-2\`` : 'Chart libraries not installed. Run `pnpm install chart.js react-chartjs-2`');
        }
      }
    })();
    return () => { mounted = false };
  }, []);

  if (loading) return <div className="p-4">Loading metrics…</div>;
  if (!data) return <div className="p-4 text-sm text-muted-foreground">Metrics not available.</div>;
  if (data?.error === 'Unauthorized' || data?.status === 401) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <div>Sign in as an admin to view metrics.</div>
        {process.env.NODE_ENV !== 'production' && data?.debug ? (
          <pre className="mt-2 text-xs bg-muted/5 p-2 rounded text-muted-foreground">{JSON.stringify(data.debug, null, 2)}</pre>
        ) : null}
      </div>
    );
  }

  // Compute totals to show above the chart
  const totals = {
    views: (data?.series?.views || []).reduce((a:number,b:number) => a + b, 0),
    likes: (data?.series?.likes || []).reduce((a:number,b:number) => a + b, 0),
    shares: (data?.series?.shares || []).reduce((a:number,b:number) => a + b, 0),
  };

  const chartData = {
    labels: data.days,
    datasets: [
      {
        label: 'Views',
        data: data.series.views,
        borderColor: 'rgb(59 130 246)',
        backgroundColor: 'rgba(59,130,246,0.1)',
        tension: 0.2,
      },
      {
        label: 'Likes',
        data: data.series.likes,
        borderColor: 'rgb(234 88 12)',
        backgroundColor: 'rgba(234,88,12,0.08)',
        tension: 0.2,
      },
      {
        label: 'Shares',
        data: data.series.shares,
        borderColor: 'rgb(16 185 129)',
        backgroundColor: 'rgba(16,185,129,0.08)',
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium">Activity metrics (last {rangeDays} days)</h3>
        <div className="flex items-center gap-2">
          <select value={String(rangeDays)} onChange={(e) => setRangeDays(Number(e.target.value))} className="rounded border px-2 py-1 text-sm">
            <option value="7">7d</option>
            <option value="30">30d</option>
            <option value="90">90d</option>
            <option value="180">180d</option>
            <option value="365">365d</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 items-center mb-3">
        <div className="px-3 py-2 rounded bg-blue-50 text-sm">
          <div className="text-xs text-muted-foreground">Views</div>
          <div className="font-semibold">{totals.views.toLocaleString()}</div>
        </div>
        <div className="px-3 py-2 rounded bg-orange-50 text-sm">
          <div className="text-xs text-muted-foreground">Likes</div>
          <div className="font-semibold">{totals.likes.toLocaleString()}</div>
        </div>
        <div className="px-3 py-2 rounded bg-green-50 text-sm">
          <div className="text-xs text-muted-foreground">Shares</div>
          <div className="font-semibold">{totals.shares.toLocaleString()}</div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        {/* Use the client-only ChartClient component (dynamically loaded). */}
        <ChartClient data={chartData} />
      </div>
    </div>
  );
}

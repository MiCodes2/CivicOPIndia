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

  if (loading) return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
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

  // Compute totals and averages
  const totals = {
    views: (data?.series?.views || []).reduce((a:number,b:number) => a + b, 0),
    likes: (data?.series?.likes || []).reduce((a:number,b:number) => a + b, 0),
    shares: (data?.series?.shares || []).reduce((a:number,b:number) => a + b, 0),
  };

  const averages = {
    views: Math.round(totals.views / rangeDays),
    likes: Math.round(totals.likes / rangeDays),
    shares: Math.round(totals.shares / rangeDays),
  };

  // Format date range for display
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - rangeDays + 1);
  const dateRangeText = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

  const chartData = {
    labels: data.days,
    datasets: [
      {
        label: 'Views',
        data: data.series.views,
        borderColor: 'rgb(59 130 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59 130 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(59 130 246)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Likes',
        data: data.series.likes,
        borderColor: 'rgb(234 88 12)',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(234 88 12)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(234 88 12)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Shares',
        data: data.series.shares,
        borderColor: 'rgb(16 185 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16 185 129)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(16 185 129)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      },
    ],
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity Metrics</h3>
          <p className="text-sm text-gray-600 mt-1">{dateRangeText}</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="timeRange" className="text-sm font-medium text-gray-700">Time range:</label>
          <select
            id="timeRange"
            value={String(rangeDays)}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">365 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Views</p>
              <p className="text-2xl font-bold text-blue-900">{totals.views.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">{averages.views.toLocaleString()} per day</p>
            </div>
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Total Likes</p>
              <p className="text-2xl font-bold text-orange-900">{totals.likes.toLocaleString()}</p>
              <p className="text-xs text-orange-600 mt-1">{averages.likes.toLocaleString()} per day</p>
            </div>
            <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Shares</p>
              <p className="text-2xl font-bold text-green-900">{totals.shares.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">{averages.shares.toLocaleString()} per day</p>
            </div>
            <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="max-w-full overflow-x-auto">
          {/* Use the client-only ChartClient component (dynamically loaded). */}
          <ChartClient data={chartData} />
        </div>
      </div>
    </div>
  );
}

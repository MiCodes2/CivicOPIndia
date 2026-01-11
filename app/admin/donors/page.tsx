"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DonorCharts = dynamic(() => import('@/components/admin/DonorCharts'), { ssr: false, loading: () => <div className="text-sm text-muted-foreground">Loading charts…</div> });

export default function AdminDonorsPage() {
  const [user, setUser] = useState<any>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<{ donor_count:number; total_in_inr:number } | null>(null);
  const [cityBreakdown, setCityBreakdown] = useState<Array<{ city:string; donor_count:number; total_in_inr:number }>>([]);
  const [dailyTotals, setDailyTotals] = useState<Array<{ day:string; donor_count:number; total_in_inr:number }>>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkUser();
    loadDonors();
    loadMetrics();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
      } else {
        setUser(user);
      }
    } catch (e) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadDonors = async () => {
    const { data } = await supabase.from('donors').select('*').order('created_at', { ascending: false }).limit(500);
    if (data) setDonors(data);
  };

  const loadMetrics = async () => {
    const { data: totalsData } = await supabase.from('donor_totals').select('*').maybeSingle();
    if (totalsData) setTotals(totalsData as any);

    const { data: cities } = await supabase.from('donor_city_totals').select('*').order('total_in_inr', { ascending: false }).limit(50);
    if (cities) setCityBreakdown(cities as any[] || []);

    // Fetch server-aggregated daily totals (preferred over computing on client)
    const { data: daily } = await supabase.from('donor_daily_totals').select('*').order('day', { ascending: true }).limit(365);
    if (daily) setDailyTotals(daily as any[] || []);
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donors</h1>
          <p className="text-sm text-muted-foreground">List of donations received</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total Donors</div>
            <div className="font-semibold text-lg">{totals ? totals.donor_count : '—'}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total Raised (INR)</div>
            <div className="font-semibold text-lg">{totals ? `₹${totals.total_in_inr.toLocaleString()}` : '—'}</div>
          </div>
          <Button variant="outline" onClick={() => { loadDonors(); loadMetrics(); }}>Refresh</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Cities by Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="max-h-[520px] overflow-y-auto pr-2">
                <table className="w-full text-sm table-auto">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2">City</th>
                      <th className="p-2">Donors</th>
                      <th className="p-2">Total (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityBreakdown.map((c) => (
                      <tr key={c.city} className="border-t">
                        <td className="p-2">{c.city}</td>
                        <td className="p-2">{c.donor_count}</td>
                        <td className="p-2">₹{c.total_in_inr.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-[520px]">
          <CardHeader>
            <CardTitle>Charts & Summary</CardTitle>
          </CardHeader>
          <CardContent className="h-full flex flex-col">
            <div className="flex-1">
              <DonorCharts cities={cityBreakdown} dailyTotals={dailyTotals} days={30} />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div><strong>Total Donors:</strong> {totals ? totals.donor_count : '—'}</div>
              <div><strong>Total Raised:</strong> {totals ? `₹${totals.total_in_inr.toLocaleString()}` : '—'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donor Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Name</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Currency</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Address</th>
                    <th className="p-2">Tx ID</th>
                    <th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="p-2">{d.name}</td>
                      <td className="p-2">{d.amount_in_inr ? `₹${d.amount_in_inr}` : d.amount}</td>
                      <td className="p-2">{d.currency}</td>
                      <td className="p-2">{d.email}</td>
                      <td className="p-2">{d.phone}</td>
                      <td className="p-2">{d.address}</td>
                      <td className="p-2">{d.tx_id}</td>
                      <td className="p-2">{formatDateShort(d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

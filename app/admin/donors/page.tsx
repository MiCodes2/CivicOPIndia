"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function AdminDonorsPage() {
  const [user, setUser] = useState<any>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkUser();
    loadDonors();
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

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donors</h1>
          <p className="text-sm text-muted-foreground">List of donations received</p>
        </div>
        <div>
          <Button variant="outline" onClick={loadDonors}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donor Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
        </CardContent>
      </Card>
    </div>
  );
}

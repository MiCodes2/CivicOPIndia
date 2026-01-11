import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from '@/lib/pageMetadata'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PayPalDonate from "@/components/PayPalDonate";
import DonationForm from "@/components/DonationForm";
import { Heart, Shield, Users, Eye, CheckCircle } from "lucide-react";

import { createClient } from '@/lib/supabase/server'

export default async function DonatePage() {
  // Fetch live metrics (fallback to sensible defaults if supabase isn't configured)
  let totalRaised = 700000; // fallback ₹7L
  let donorCount = 109; // fallback
  let campaignCount = 23; // fallback
  let recentDonors = [] as Array<{ id: number; name: string | null; amount_in_inr: number | null; address: string | null; created_at: string }>;

  // Goal for progress bar (INR)
  const goal = Number(process.env.NEXT_PUBLIC_DONATION_GOAL_INR || 1000000);
  let percent = 0;

  try {
    const supabase = await createClient();
    const { data: totalsData } = await supabase.from('donor_totals').select('*').maybeSingle();
    if (totalsData) {
      totalRaised = Number(totalsData.total_in_inr || totalRaised);
      donorCount = Number(totalsData.donor_count || donorCount);
    }

    // Count activities that look like campaigns (case-insensitive 'campaign')
    const { count } = await supabase.from('activities').select('*', { count: 'exact', head: true }).ilike('type', '%campaign%');
    if (typeof count === 'number') campaignCount = count;

    // Fetch a short list of recent donors to display on the public donate page (names shortened for privacy)
    const { data: recent } = await supabase.from('donors').select('id,name,amount_in_inr,address,created_at').order('created_at', { ascending: false }).limit(6);
    if (recent) recentDonors = recent as any;

    percent = Math.min(100, Math.round((totalRaised / (goal || 1)) * 100));
  } catch (e) {
    // Keep fallback values on error
  }

  // Public capping helpers: do not display numbers larger than 10,000 on the public donate page
  const capNumber = (n: number) => (n > 10000 ? '10,000+' : n.toLocaleString());
  const capCurrency = (n: number) => (n > 10000 ? '₹10,000+' : `₹${n.toLocaleString()}`);

  const impactStats = [
    { value: capCurrency(totalRaised), label: "Funds Raised" },
    { value: "100%", label: "Transparency" },
    { value: capNumber(donorCount), label: "Donors" },
    { value: capNumber(campaignCount), label: "Campaigns" },
  ];

  const usageBreakdown = [
    { category: "Field Operations", percentage: "40%", description: "On-ground activities, protests, and community organizing" },
    { category: "Legal Support", percentage: "25%", description: "Filing RTIs, court cases, and legal assistance" },
    { category: "Awareness Campaigns", percentage: "20%", description: "Media outreach, educational materials, and events" },
    { category: "Administrative", percentage: "10%", description: "Office operations, website, and technology" },
    { category: "Emergency Fund", percentage: "5%", description: "Reserved for urgent civic action needs" },
  ];

  const donationTiers = [
    { amount: 500, label: "Supporter", impact: "Help spread awareness in 1 community" },
    { amount: 2000, label: "Advocate", impact: "Fund 1 RTI filing and processing" },
    { amount: 5000, label: "Champion", impact: "Support a full day of civic action" },
    { amount: 10000, label: "Leader", impact: "Enable a complete campaign initiative" },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 via-primary/20 to-transparent shadow-md">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-primary">Support Our Mission</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Your contribution helps us fight for transparency, accountability, and justice.
            Every rupee counts in building a better democracy.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your support helps sustain independent civic initiatives and public-interest projects.
          </p>


        </div> 

        {/* Impact Stats */}
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {impactStats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress toward funding goal */}
        <div className="mb-12">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <div>Progress toward goal</div>
            <div className="font-semibold">{capCurrency(totalRaised)} / {capCurrency(goal)}</div>
          </div>
          <div className="w-full bg-muted h-3 rounded overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <DonationForm />

          {/* Fund Usage & Transparency */}
          <div className="space-y-6">
              {/* Recent Donors */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Donors</CardTitle>
                <CardDescription className="text-sm">Names may be shortened for privacy</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recentDonors.length === 0 ? (
                    <li className="text-sm text-muted-foreground">No recent donors yet — be the first to contribute!</li>
                  ) : (
                    recentDonors.map((d) => {
                      const name = d.name || 'Anonymous';
                      const parts = name.trim().split(/\s+/);
                      const display = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
                      return (
                        <li key={d.id} className="flex items-center justify-between">
                          <div className="text-sm">
                            <div className="font-medium">{display}</div>
                            <div className="text-xs text-muted-foreground">{d.address || ''}</div>
                          </div>
                          <div className="text-sm font-semibold">{capCurrency(Number(d.amount_in_inr || 0))}</div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Transparency Promise */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <Eye className="h-8 w-8 text-primary" />
                <CardTitle>100% Transparent</CardTitle>
                <CardDescription className="text-base">
                  Every donation is publicly tracked and audited
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Public financial reports published quarterly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>All expenditures reviewed by citizen committee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Independent audits by certified accountants</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fund Usage Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>How We Use Your Donations</CardTitle>
                <CardDescription>
                  Transparent breakdown of fund allocation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {usageBreakdown.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <span className="font-bold text-primary">{item.percentage}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: item.percentage }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Impact Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Your Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {donationTiers.map((tier) => (
                  <div key={tier.amount} className="flex items-start gap-3 text-sm">
                    <div className="flex h-6 w-16 shrink-0 items-center justify-center rounded bg-primary/10 font-semibold text-primary">
                      ₹{tier.amount}
                    </div>
                    <span className="text-muted-foreground">{tier.impact}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            🔒 SSL Secured • 🛡️ Data Protected • 📊 Fully Transparent
          </p>
        </div> 
      </div>
    </div>
  );
}

export const metadata = pageMetadata.donate

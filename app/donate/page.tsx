import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from '@/lib/pageMetadata'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Shield, Users, Eye, CheckCircle } from "lucide-react";

export default function DonatePage() {
  const impactStats = [
    { value: "₹25L+", label: "Funds Raised" },
    { value: "100%", label: "Transparency" },
    { value: "5000+", label: "Donors" },
    { value: "50+", label: "Campaigns" },
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
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">Support Our Mission</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Your contribution helps us fight for transparency, accountability, and justice.
            Every rupee counts in building a better democracy.
          </p>
        </div>

        {/* Impact Stats */}
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {impactStats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Donation Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Make a Donation</CardTitle>
                <CardDescription className="text-base">
                  Secure payment powered by Razorpay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Amount Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Amount</label>
                  <div className="grid grid-cols-2 gap-2">
                    {donationTiers.map((tier) => (
                      <Button key={tier.amount} variant="outline" className="h-auto flex-col py-3">
                        <span className="text-lg font-bold">₹{tier.amount}</span>
                        <span className="text-xs text-muted-foreground">{tier.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Or Enter Custom Amount (₹)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    min="1"
                    className="text-lg"
                  />
                </div>

                {/* Donor Details */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Your Name (Optional)
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Anonymous Donor"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email (For Receipt)
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                  />
                </div>

                <Button className="w-full" size="lg">
                  <Heart className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  🔒 Secure payment • UPI, Cards, Netbanking, Wallets accepted
                </p>
              </CardContent>
            </Card>

            {/* Why Donate */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Why Your Support Matters</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Enable citizens to hold power accountable",
                    "Fund critical RTI requests and legal battles",
                    "Organize protests and awareness campaigns",
                    "Provide free legal support to affected citizens",
                    "Build a transparent democracy for future generations",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Fund Usage & Transparency */}
          <div className="space-y-6">
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
            🔒 SSL Secured • 🛡️ Data Protected • 📊 Fully Transparent • ✅ Tax Receipt Provided
          </p>
        </div>
      </div>
    </div>
  );
}

export const metadata = pageMetadata.donate


import Link from "next/link";
import { pageMetadata } from '@/lib/pageMetadata'
import { Button } from "@/components/ui/button";
import EventsList from '@/components/EventsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { decodeHtmlEntities } from '@/lib/formatContent';
import { Activity, Archive, Heart, Users, Target, FileText, Megaphone, Shield } from "lucide-react";
import TeamMemberCard from "@/components/TeamMemberCard";
import StatsSection from "@/components/StatsSection";

export default function HomePage() {
  const stats = [
    { value: "500+", label: "Activities" },
    { value: "50+", label: "Protests" },
    { value: "34K+", label: "Supporters", dynamic: true, api: "/api/x/followers" },
    { value: "5+", label: "Years" }
  ];

  const initiatives = [
    {
      title: "Peaceful Protests",
      description: "Organizing non-violent demonstrations and rallies to raise awareness and demand accountability.",
      icon: Target
    },
    {
      title: "RTI Campaigns",
      description: "Filing Right to Information requests to uncover government transparency issues.",
      icon: FileText
    },
    {
      title: "Legal Advocacy",
      description: "Providing legal support and representation for citizens facing injustice.",
      icon: Shield
    },
    {
      title: "Community Organizing",
      description: "Building grassroots networks to empower local communities and foster collective action.",
      icon: Users
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "CivicOp - Civic Operations of India",
            "url": "https://civicop.in",
            "logo": "https://civicop.in/logo.png",
            "description": "India's leading civic engagement platform for transparent governance, protests tracking, RTI filing, and AI-powered civic operations.",
            "foundingDate": "2020",
            "sameAs": [
              "https://x.com/CivicOp_india",
              "https://www.facebook.com/CivicOpIndia"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+91-XXXXXXXXXX", // Add actual contact
              "contactType": "customer service",
              "availableLanguage": "English"
            },
            "offers": [
              {
                "@type": "Service",
                "name": "Civic Engagement Platform",
                "description": "Real-time tracking of protests, RTI campaigns, and civic issues"
              },
              {
                "@type": "Service",
                "name": "AI-Powered Governance",
                "description": "Future AI verification, predictive analytics, and municipal APIs"
              }
            ],
            "areaServed": {
              "@type": "Country",
              "name": "India"
            },
            "knowsAbout": [
              "Civic Engagement",
              "Digital Governance",
              "AI for Social Good",
              "Transparency in Government",
              "Citizen Rights",
              "Protests and Demonstrations",
              "Right to Information (RTI)"
            ]
          })
        }}
      />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-br from-primary/10 via-accent/10 to-background py-16">
        <div className="container mx-auto px-3">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Civic Opposition of India
            </h1>
            <p className="mt-6 text-xl text-muted-foreground sm:text-2xl">
              Building a transparent, accountable democracy through collective civic action.
              Together, we hold power accountable and create lasting change.
            </p>
            <p className="mt-2 text-lg text-primary font-semibold">Real-Time Civic Governance Dashboard</p>
            <p className="mt-1 text-sm italic text-muted-foreground">Evolving into CivicOp (Civic Operations of India) in 2026</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-lg w-full sm:w-auto bg-gradient-to-r from-primary to-emerald-500 text-white shadow-lg hover:scale-[1.02] transition-transform">
                <Link href="/activities">Explore Activities</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-lg w-full sm:w-auto">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="border-b py-12">
        <div className="container mx-auto px-3">
          <div className="mx-auto max-w-4xl">
          <div className="text-center mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold">On-ground Events</h2>
            <p className="mt-2 text-sm text-muted-foreground">Standard events organized by the community</p>
          </div>
            {/* Server-rendered event list will be hydrated on client; fetch via /api/events or render minimal placeholder here. */}
            <div id="events-list" className="mt-6">
              <EventsList />
            </div>
          </div>
        </div>
      </section>

      {/* Future Roadmap Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-3">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight">Future Roadmap: Portal</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Innovative tools to revolutionize civic engagement and governance
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">BETA</span>
                </div>
                <CardTitle className="text-xl">AI-Powered Verification</CardTitle>
                <CardDescription className="text-base">
                  Automated validation of civic complaints using Computer Vision to filter spam and prioritize emergencies.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">IN DEV</span>
                </div>
                <CardTitle className="text-xl">Predictive Ward Analytics</CardTitle>
                <CardDescription className="text-base">
                  Machine Learning models that forecast infrastructure failures before they happen.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">PLANNED</span>
                </div>
                <CardTitle className="text-xl">Municipal Dashboard API</CardTitle>
                <CardDescription className="text-base">
                  Direct integration for city officials to resolve tickets 3x faster.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Partners / GovTech CTA Section */}
      <section id="partners-govtech" className="py-16 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Empowering Smart Cities</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Are you a Municipal Corporation? Learn how our data can help you optimize resource allocation.
            </p>
            <Button asChild className="mt-6">
              <Link href="/contact">Request Pilot Access</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection initialStats={stats} />

      {/* About Section */}
      <section className="py-16">
        <div className="container mx-auto px-3">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight">Who We Are</h2>
            <p className="mt-6 text-lg text-muted-foreground">
              The Civic Opposition of India is a grassroots movement dedicated to building a more 
              transparent and accountable democracy. We believe that every citizen has the power 
              to create change, and together we can hold those in power accountable for their actions.
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              Through peaceful protests, legal advocacy, RTI campaigns, and community organizing, 
              we work tirelessly to ensure that the voices of ordinary citizens are heard and their 
              rights are protected.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="border-t py-16">
        <div className="container mx-auto px-3">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight">Our Leadership Team</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Dedicated leaders working tirelessly for transparency and accountability
            </p>
          </div>

          <div className="mx-auto flex flex-row flex-wrap justify-center gap-8 max-w-5xl">
            <Link href="/team/mithilesh-kumar" className="flex-1 min-w-[220px] max-w-xs text-center">
              <TeamMemberCard
                name="Mithilesh Kumar"
                role="CEO & Founder"
                description="Visionary leader driving civic accountability and democratic reform"
                imageSrc="/mithilesh-kumar.jpeg"
                initials="MK"
              />
            </Link>
            <Link href="/team/dr-anisha" className="flex-1 min-w-[220px] max-w-xs text-center">
              <TeamMemberCard
                name="Dr. Anisha"
                role="Co-founder"
                description="Expert in policy advocacy and grassroots mobilization"
                imageSrc="/dr-anisha.jpeg"
                initials="DA"
              />
            </Link>
            <Link href="/team/arif-mudgal" className="flex-1 min-w-[220px] max-w-xs text-center">
              <TeamMemberCard
                name="ARIF MUDGAL"
                role="Member"
                description="Community organizer and civic engagement specialist"
                imageSrc="/arif-mudgal.jpg"
                initials="AM"
              />
            </Link>
            <Link href="/team/capt-santhosh" className="flex-1 min-w-[220px] max-w-xs text-center">
              <TeamMemberCard
                name="Capt Santhosh Kumar"
                role="Advisor"
                description="Retired Army officer & environmental activist"
                imageSrc="/Capt_Santhosh_portrait.jpg"
                initials="CS"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="border-t py-16">
        <div className="container mx-auto px-3">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight">Our Partner Organizations</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We collaborate with leading civic, research, and community organizations to strengthen our impact.
            </p>
          </div>
          <div className="mx-auto flex flex-row flex-wrap justify-center gap-8 max-w-5xl">
            <Link href="/partners/namma-bengaluru" className="flex-1 min-w-[180px] max-w-xs text-center">
              <div className="bg-card rounded-xl p-6 shadow hover:shadow-lg transition">
                <img src="/NBF-Logo-Bold.png" alt="Namma Bengaluru Foundation Logo" className="mx-auto h-16 mb-4" />
                <div className="font-semibold">Namma Bengaluru Foundation</div>
              </div>
            </Link>
            <Link href="/partners/whitefield-rising" className="flex-1 min-w-[180px] max-w-xs text-center">
              <div className="bg-card rounded-xl p-6 shadow hover:shadow-lg transition">
                <img src="/wrising.jpg" alt="Whitefield Rising Logo" className="mx-auto h-16 mb-4" />
                <div className="font-semibold">Whitefield Rising</div>
              </div>
            </Link>
            <Link href="/partners/wri-india" className="flex-1 min-w-[180px] max-w-xs text-center">
              <div className="bg-card rounded-xl p-6 shadow hover:shadow-lg transition">
                <img src="/wri-india.png" alt="WRI India Logo" className="mx-auto h-16 mb-4" />
                <div className="font-semibold">WRI India</div>
              </div>
            </Link>
            <Link href="/partners/citizen-matters" className="flex-1 min-w-[180px] max-w-xs text-center">
              <div className="bg-card rounded-xl p-6 shadow hover:shadow-lg transition">
                <img src="/CITIZEN-MATTERS-Logo.jpg" alt="Citizen Matters Logo" className="mx-auto h-16 mb-4" />
                <div className="font-semibold">Citizen Matters</div>
              </div>
            </Link>
            <Link href="/partners/blrpost" className="flex-1 min-w-[180px] max-w-xs text-center">
              <div className="bg-card rounded-xl p-6 shadow hover:shadow-lg transition">
                <img src="/blrpost.jpg" alt="BLR Post Logo" className="mx-auto h-16 mb-4" />
                <div className="font-semibold">BLR Post</div>
              </div>
            </Link>
            <Link href="/partners/baf" className="flex-1 min-w-[180px] max-w-xs text-center">
              <div className="bg-card rounded-xl p-6 shadow hover:shadow-lg transition">
                <img src="/baf.jpg" alt="BAF Logo" className="mx-auto h-16 mb-4" />
                <div className="font-semibold">Bangalore Apartments’ Federation</div>
              </div>
            </Link>
            <Link href="/partners/conscious-communities" className="flex-1 min-w-[180px] max-w-xs text-center">
              <div className="bg-card rounded-xl p-6 shadow hover:shadow-lg transition">
                <img src="https://lzpyfvqdimkrkioxrzbf.supabase.co/storage/v1/object/public/CivicOPI/ConsciousCommunities.PNG" alt="Conscious Communities Logo" className="mx-auto h-16 mb-4" />
                <div className="font-semibold">Conscious Communities</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Initiatives Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-3">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight">Our Initiatives</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comprehensive programs designed to empower citizens and strengthen democracy
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {initiatives.map((initiative, index) => {
              const Icon = initiative.icon;
              return (
                <Card key={index} className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <Icon className="h-12 w-12 text-primary" />
                    <CardTitle className="text-xl">{decodeHtmlEntities(initiative.title)}</CardTitle>
                    <CardDescription className="text-base">
                      {initiative.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight">What We Offer</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Resources and tools to empower your civic engagement
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Activity className="h-12 w-12 text-primary" />
                <CardTitle className="text-xl">Daily Activities</CardTitle>
                <CardDescription className="text-base">
                  Track our protests, meetings, and community initiatives in real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Archive className="h-12 w-12 text-primary" />
                <CardTitle className="text-xl">Information Archive</CardTitle>
                <CardDescription className="text-base">
                  Access verified RTI responses, court orders, and policy documents
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Users className="h-12 w-12 text-primary" />
                <CardTitle className="text-xl">Advocacy Campaigns</CardTitle>
                <CardDescription className="text-base">
                  Join petitions and campaigns for systemic change and accountability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Heart className="h-12 w-12 text-primary" />
                <CardTitle className="text-xl">Transparent Funding</CardTitle>
                <CardDescription className="text-base">
                  Support our work with donations tracked publicly for full accountability
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Citizens Issue Box Section */}
      <section className="border-t bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <span className="text-2xl animate-pulse">📢</span>
                </div>
                <CardTitle className="text-lg text-primary mb-3">
                  Citizens Issue Box
                </CardTitle>
                <CardDescription className="text-sm font-medium text-primary/80 mb-4">
                  Your voice matters - we will share with relevant authorities
                </CardDescription>
                <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.05]">
                  <Link href="/citizens-issue" className="flex items-center justify-center gap-2">
                    <span>Report Issue</span>
                    <span className="animate-bounce text-sm">→</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="border-t bg-gradient-to-br from-primary/20 to-accent/20 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight">Ready to Make a Difference?</h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Join thousands of citizens working together for a better, more accountable India
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-lg w-full sm:w-auto bg-gradient-to-r from-primary to-emerald-500 text-white shadow-lg hover:scale-[1.02] transition-transform">
                <Link href="/activities">View Activities</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-white shadow-lg hover:scale-[1.02] transition-transform">
                <Link href="/citizens-issue">Report Issue</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency by Design Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight">Transparency by Design</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our AI systems are built with open-source principles and full accountability
            </p>
          </div>
          <div className="mx-auto max-w-4xl">
            <div className="bg-black rounded-lg shadow-2xl overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center px-4 py-2 bg-gray-800">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="ml-4 text-gray-400 text-sm">CivicOp Terminal</div>
              </div>
              {/* Terminal Body */}
              <div className="p-6 font-mono text-sm text-green-400 bg-black">
                <pre className="whitespace-pre-wrap">
{`# SYSTEM_MANIFEST: CivicOp_City_Sentinel_v2.1
agent_profile:
  name: "CityOps Sentinel"
  role: "Autonomous Civic Governance Auditor"
  architecture: "Multi-Modal LLM + Geospatial Anomaly Detection"
  deployment_status: "BETA (Ward 44, Bengaluru)"

core_directives:
  1. VERIFY_REALITY:
     - Analyze citizen reports (images/video) for authenticity.
     - METRIC: Reduce false positives by 99% before human review.
  2. PREDICT_FAILURE:
     - OUTPUT: "Pre-Crime" alerts for infrastructure.
     - ACTION: Notify Traffic Management Center API.
  3. ENFORCE_ACCOUNTABILITY:
     - IF resolution_time > SLA (72 hours):
         THEN escalate_to: Zonal_Commissioner

constraints:
  - PRIVACY_FIRST: Automatically blur faces and license plates.
  - BIAS_CHECK: Prioritize issues based on severity, not neighborhood affluence.`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export const metadata = pageMetadata.home

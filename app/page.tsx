
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
      title: "Civic Pressure Groups",
      description: "Mobilizing citizens to demand accountability for potholes, broken drains, and streetlight failures.",
      icon: Target
    },
    {
      title: "Transparency Audits",
      description: "Using RTI and data analysis to expose corruption in road tenders and public works contracts.",
      icon: FileText
    },
    {
      title: "Emergency Response",
      description: "Coordinating with police and local authorities for immediate relief during floods and civic emergencies.",
      icon: Shield
    },
    {
      title: "Ecological Protection",
      description: "Fighting to reclaim encroached Rajakaluves (stormwater drains) and restoring Bengaluru's dying lakes.",
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
            <p className="mt-6 text-lg text-primary font-semibold">Real-Time Civic Governance Dashboard</p>
            <p className="mt-1 text-sm italic text-muted-foreground">Evolving into CivicOp (Civic Operations of India) in 2026</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-lg w-full sm:w-auto bg-gradient-to-r from-primary to-emerald-500 text-white shadow-lg hover:scale-[1.02] transition-transform">
                <Link href="/activities">Explore Activities</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors shadow-md">
                <Link href="https://app.civicopindia.com" target="_blank" className="flex items-center gap-2">
                  <img src="https://app.civicopindia.com/CivicOP_logo.png" alt="CivicOP" className="h-6 w-6" />
                  <span>Launch CivicOp v2.0</span>
                </Link>
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <img src="https://app.civicopindia.com/CivicOP_logo.png" alt="CivicOP Logo" className="h-12 w-12 sm:h-16 sm:w-16" />
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Future Roadmap: CivicOp v2.0</h2>
            </div>
            <p className="mt-4 text-lg text-muted-foreground">
              Innovative tools to revolutionize civic engagement and governance
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-shadow hover:shadow-lg border-t-4 border-t-emerald-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 text-xs font-semibold bg-emerald-600 text-white rounded">LIVE PILOT</span>
                </div>
                <CardTitle className="text-xl text-emerald-600">AI-Powered Verification</CardTitle>
                <CardDescription className="text-base">
                  Automated validation of civic complaints using Computer Vision to filter spam and prioritize emergencies.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="transition-shadow hover:shadow-lg border-t-4 border-t-cyan-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 text-xs font-semibold bg-amber-500 text-white rounded">BETA</span>
                </div>
                <CardTitle className="text-xl text-cyan-600">Predictive Ward Analytics</CardTitle>
                <CardDescription className="text-base">
                  Machine Learning models that forecast infrastructure failures before they happen.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="transition-shadow hover:shadow-lg border-t-4 border-t-green-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded">AVAILABLE</span>
                </div>
                <CardTitle className="text-xl text-green-700">Municipal Command Center</CardTitle>
                <CardDescription className="text-base">
                  Enterprise-grade dashboard for city officials to visualize data and resolve tickets 3x faster.
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
              <Link href="https://app.civicopindia.com">Launch Governance Portal</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Statement - Modern GovTech Focus */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-3">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
                From Grassroots Activism to <span className="text-primary">GovTech Operations</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                CivicOp transforms urban chaos into structured, data-driven civic accountability. 
                We're building India's first citizen-powered infrastructure monitoring platform.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card rounded-xl p-6 shadow-lg border-t-4 border-t-emerald-500">
                <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-2">500+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-3">Civic Operations</div>
                <p className="text-sm">Ground interventions from pothole fixes to lake restoration</p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-lg border-t-4 border-t-cyan-500">
                <div className="text-3xl sm:text-4xl font-bold text-cyan-600 mb-2">34K+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-3">Active Citizens</div>
                <p className="text-sm">Community members tracking & reporting civic issues daily</p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-lg border-t-4 border-t-green-600">
                <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">5 Years</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-3">Field Experience</div>
                <p className="text-sm">Proven track record of operational excellence in Bengaluru</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6 sm:p-8 md:p-12">
              <h3 className="text-xl sm:text-2xl font-bold mb-4">The CivicOp Model</h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                We combine <strong>on-ground operations</strong> (fixing roads, clearing drains, emergency response) 
                with <strong>data intelligence</strong> (AI verification, predictive analytics, ward mapping) to create 
                measurable civic impact. This isn't just activism—it's <strong>Urban Operations Management</strong>.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔍</div>
                  <div>
                    <strong className="text-primary">Transparency Audits:</strong> RTI-driven investigations into road tenders and public works corruption
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🚨</div>
                  <div>
                    <strong className="text-primary">Emergency Coordination:</strong> Real-time response for floods, civic emergencies with police/authorities
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💧</div>
                  <div>
                    <strong className="text-primary">Ecological Protection:</strong> Reclaiming encroached Rajakaluves and restoring Bengaluru's water bodies
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📊</div>
                  <div>
                    <strong className="text-primary">Data-Driven Advocacy:</strong> Using geospatial analytics and ward data to prioritize interventions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - Streamlined */}
      <section className="border-t py-16 bg-muted/20">
        <div className="container mx-auto px-3">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight">Leadership Team</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tech architects and civic strategists driving operational excellence
            </p>
          </div>

          <div className="mx-auto flex flex-row flex-wrap justify-center gap-8 max-w-5xl">
            <Link href="/team/mithilesh-kumar" className="flex-1 min-w-[240px] max-w-sm">
              <TeamMemberCard
                name="Mithilesh Kumar"
                role="GovTech Architect & Founder"
                description="Building scalable civic infrastructure with AI and real-time operations management"
                imageSrc="/mithilesh-kumar.jpeg"
                initials="MK"
              />
            </Link>
            <Link href="/team/dr-anisha" className="flex-1 min-w-[240px] max-w-sm">
              <TeamMemberCard
                name="Dr. Anisha"
                role="Co-founder & Field Operations"
                description="Leading on-ground interventions and community mobilization strategies"
                imageSrc="/dr-anisha.jpeg"
                initials="DA"
              />
            </Link>
            <Link href="/team/arif-mudgal" className="flex-1 min-w-[240px] max-w-sm">
              <TeamMemberCard
                name="ARIF MUDGAL"
                role="Core Member"
                description="Community organizer and civic engagement specialist"
                imageSrc="/arif-mudgal.jpg"
                initials="AM"
              />
            </Link>
            <Link href="/team/capt-santhosh" className="flex-1 min-w-[240px] max-w-sm">
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
      <section className="border-t py-16 bg-muted/20">
        <div className="container mx-auto px-3">
          <div className="mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Strategic Partners</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Collaborating with leading civic organizations to amplify impact
            </p>
          </div>
          <div className="mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 max-w-5xl">
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
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Our Initiatives</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comprehensive programs designed to empower citizens and strengthen democracy
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-3">
          <div className="mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What We Offer</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Resources and tools to empower your civic engagement
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Activity className="h-12 w-12 text-primary" />
                <CardTitle className="text-xl">Real-Time Action Logs</CardTitle>
                <CardDescription className="text-base">
                  Track our on-ground interventions, from spot-fixing roads to clearing garbage dumps
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Archive className="h-12 w-12 text-primary" />
                <CardTitle className="text-xl">Governance Knowledge Base</CardTitle>
                <CardDescription className="text-base">
                  Access verified government orders, ward maps, and encroachment data for your neighborhood
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Users className="h-12 w-12 text-primary" />
                <CardTitle className="text-xl">Public Transport Advocacy</CardTitle>
                <CardDescription className="text-base">
                  Join campaigns demanding better last-mile connectivity, metro expansion, and reliable bus services
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Heart className="h-12 w-12 text-primary" />
                <CardTitle className="text-xl">Community Impact Reports</CardTitle>
                <CardDescription className="text-base">
                  View exactly how every rupee is deployed to drive civic change and operational costs
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Citizens Issue Box Section */}
      <section className="border-t bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-12">
        <div className="container mx-auto px-3">
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

      {/* Call to Action - Modern & Actionable */}
      <section className="border-t bg-gradient-to-br from-primary/20 via-accent/10 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Ready to Create Measurable Impact?
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Join India's most data-driven civic operations platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-xl border-l-4 border-l-emerald-500">
                <h3 className="text-xl sm:text-2xl font-bold mb-3">🚀 For Citizens</h3>
                <p className="text-muted-foreground mb-6">
                  Track on-ground interventions, report civic issues, and join data-backed campaigns for your neighborhood
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="bg-gradient-to-r from-primary to-emerald-500 text-white">
                    <Link href="/activities">View Operations</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                    <Link href="/citizens-issue">Report Issue</Link>
                  </Button>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-xl border-l-4 border-l-cyan-500">
                <h3 className="text-xl sm:text-2xl font-bold mb-3">🏛️ For Municipalities</h3>
                <p className="text-muted-foreground mb-6">
                  Access our enterprise-grade Municipal Command Center for real-time civic intelligence and faster issue resolution
                </p>
                <Button asChild size="lg" variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white">
                  <Link href="https://app.civicopindia.com" target="_blank">
                    <img src="https://app.civicopindia.com/CivicOP_logo.png" alt="CivicOP" className="h-5 w-5 inline mr-2" />
                    Launch Dashboard
                  </Link>
                </Button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <strong>Transparency First:</strong> Every operation, every rupee, every decision is tracked publicly. 
                View our <Link href="/activities" className="text-primary underline">action logs</Link> and{' '}
                <Link href="/donate" className="text-primary underline">impact reports</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Intelligence Engine Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-3">
          <div className="mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">The Intelligence Engine</h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Our AI systems are built with open-source principles and full accountability
            </p>
          </div>
          <div className="mx-auto max-w-4xl">
            <div className="bg-black rounded-lg shadow-2xl overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center px-3 sm:px-4 py-2 bg-gray-800">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="ml-3 sm:ml-4 text-gray-400 text-xs sm:text-sm">CivicOp Terminal</div>
              </div>
              {/* Terminal Body */}
              <div className="p-3 sm:p-4 md:p-6 font-mono text-xs sm:text-sm text-green-400 bg-black overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">\n{`# SYSTEM_MANIFEST: CivicOp_City_Sentinel_v2.1
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

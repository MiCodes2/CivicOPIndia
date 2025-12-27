
import Link from "next/link";
import { pageMetadata } from '@/lib/pageMetadata'
import { Button } from "@/components/ui/button";
import EventsList from '@/components/EventsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { decodeHtmlEntities } from '@/lib/formatContent';
import { Activity, Archive, Heart, Users, Target, FileText, Megaphone, Shield } from "lucide-react";
import TeamMemberCard from "@/components/TeamMemberCard";

export default function HomePage() {
  const stats = [
    { value: "500+", label: "Activities" },
    { value: "50+", label: "Protests" },
    { value: "34K+", label: "Supporters" },
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

      {/* Stats Section */}
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
    </div>
  );
}

export const metadata = pageMetadata.home

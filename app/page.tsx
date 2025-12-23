import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Archive, Heart, Users, Target, FileText, Megaphone, Shield } from "lucide-react";
import TeamMemberCard from "@/components/TeamMemberCard";

export default function Home() {
  const stats = [
    { label: "Active Members", value: "34,100+" },
    { label: "Campaigns", value: "50+" },
    { label: "RTI Filed", value: "200+" },
    { label: "Communities", value: "25+" },
  ];

  const initiatives = [
    {
      icon: Target,
      title: "Policy Advocacy",
      description: "Working with citizens to advocate for better policies and governance reforms at local and national levels."
    },
    {
      icon: FileText,
      title: "RTI Campaigns",
      description: "Filing Right to Information requests to expose corruption and ensure government transparency."
    },
    {
      icon: Megaphone,
      title: "Public Awareness",
      description: "Organizing awareness campaigns, workshops, and community events to educate citizens about their rights."
    },
    {
      icon: Shield,
      title: "Legal Support",
      description: "Providing legal assistance and support to citizens fighting for justice and accountability."
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-br from-primary/10 via-accent/10 to-background py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Civic Opposition of India
            </h1>
            <p className="mt-6 text-xl text-muted-foreground sm:text-2xl">
              Building a transparent, accountable democracy through collective civic action.
              Together, we hold power accountable and create lasting change.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link href="/activities">View Our Activities</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link href="/donate">Support Our Mission</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-card py-16">
        <div className="container mx-auto px-4">
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
      <section className="py-20">
        <div className="container mx-auto px-4">
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
      <section className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight">Our Leadership Team</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Dedicated leaders working tirelessly for transparency and accountability
            </p>
          </div>

          <div className="mx-auto flex flex-row justify-center gap-8 max-w-5xl">
            <Link href="/team/mithilesh-kumar" className="flex-1 min-w-[220px] max-w-xs">
              <TeamMemberCard
                name="Mithilesh Kumar"
                role="CEO & Founder"
                description="Visionary leader driving civic accountability and democratic reform"
                imageSrc="/mithilesh-kumar.jpeg"
                initials="MK"
              />
            </Link>
            <Link href="/team/dr-ansiha" className="flex-1 min-w-[220px] max-w-xs">
              <TeamMemberCard
                name="Dr. Ansiha"
                role="Co-founder"
                description="Expert in policy advocacy and grassroots mobilization"
                imageSrc="/dr-ansiha.jpeg"
                initials="DA"
              />
            </Link>
            <Link href="/team/arif-mudgal" className="flex-1 min-w-[220px] max-w-xs">
              <TeamMemberCard
                name="ARIF MUDGAL"
                role="Member"
                description="Community organizer and civic engagement specialist"
                imageSrc="/arif-mudgal.jpg"
                initials="AM"
              />
            </Link>
            {/*
            <TeamMemberCard
              name="Sumit Gupta"
              role="Advocacy & Fundraising"
              description="Strategic fundraiser and advocacy campaign coordinator"
              imageSrc="/sumit-gupta.jpg"
              initials="SG"
            />
            */}
          </div>
        </div>
      </section>

      {/* Initiatives Section */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
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
                    <CardTitle className="text-xl">{initiative.title}</CardTitle>
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
      <section className="py-20">
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

      {/* Call to Action */}
      <section className="border-t bg-gradient-to-br from-primary/20 to-accent/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight">Ready to Make a Difference?</h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Join thousands of citizens working together for a better, more accountable India
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link href="/activities">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="text-lg">
                <Link href="/donate">Donate Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

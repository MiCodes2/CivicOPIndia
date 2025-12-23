import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Archive, Heart, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Civic Opposition of India
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              Building a transparent, accountable democracy through collective civic action.
              Together, we hold power accountable.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/activities">View Our Activities</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/donate">Support Our Mission</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">What We Do</h2>
            <p className="mt-4 text-muted-foreground">
              Empowering citizens with information, advocacy, and collective action
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Activity className="h-10 w-10 text-primary" />
                <CardTitle>Daily Activities</CardTitle>
                <CardDescription>
                  Track our protests, meetings, and community initiatives in real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Archive className="h-10 w-10 text-primary" />
                <CardTitle>Information Archive</CardTitle>
                <CardDescription>
                  Access verified RTI responses, court orders, and policy documents
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary" />
                <CardTitle>Advocacy Campaigns</CardTitle>
                <CardDescription>
                  Join petitions and campaigns for systemic change and accountability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-10 w-10 text-primary" />
                <CardTitle>Transparent Funding</CardTitle>
                <CardDescription>
                  Support our work with donations tracked publicly for full accountability
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ready to Make a Difference?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of citizens working together for a better India
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/activities">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

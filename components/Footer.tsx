import Link from "next/link";
import { Youtube, Twitter, Heart, Mail, MapPin } from "lucide-react";

export default function Footer() {
  // In the future, this can be fetched from Twitter API
  const twitterFollowers = "34,100";
  const youtubeSubscribers = "5,000+";

  return (
    <footer className="border-t bg-muted/30">
      {/* Social Stats Bar */}
      <div className="border-b bg-primary/5">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
            <div className="text-center">
              <div className="mb-1 text-sm font-medium text-muted-foreground">Join Our Community</div>
              <div className="flex items-center justify-center gap-6">
                <Link
                  href="https://x.com/CivicOp_india"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 transition-colors hover:text-primary"
                >
                  <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-2 shadow-sm transition-shadow group-hover:shadow-md">
                    <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Twitter/X</div>
                      <div className="text-lg font-bold text-primary">{twitterFollowers}</div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="https://www.youtube.com/@CivicOPIndia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 transition-colors hover:text-primary"
                >
                  <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-2 shadow-sm transition-shadow group-hover:shadow-md">
                    <Youtube className="h-5 w-5 text-[#FF0000]" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">YouTube</div>
                      <div className="text-lg font-bold text-primary">{youtubeSubscribers}</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Civic Opposition of India</h3>
            <p className="text-sm text-muted-foreground">
              Building a transparent, accountable democracy through collective civic action and grassroots mobilization.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground transition-colors hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/activities" className="text-muted-foreground transition-colors hover:text-primary">
                  Activities
                </Link>
              </li>
              <li>
                <Link href="/donate" className="text-muted-foreground transition-colors hover:text-primary">
                  Donate
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <span>contact@civicopindia.org</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>India</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Support Our Work</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Your contribution helps us fight for transparency and justice.
            </p>
            <Link
              href="/donate"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Heart className="h-4 w-4" />
              Donate Now
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>© {new Date().getFullYear()} Civic Opposition of India. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="transition-colors hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="#" className="transition-colors hover:text-primary">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

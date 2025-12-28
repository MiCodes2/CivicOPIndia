"use client";

import Link from "next/link";
import { Heart, Mail, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export default function Footer() {
  // Load X widgets script for official follow button
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.querySelector('script[src="https://platform.x.com/widgets.js"]')) return;
    const s = document.createElement('script');
    s.src = 'https://platform.x.com/widgets.js';
    s.async = true;
    s.charset = 'utf-8';
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, []);

  // Fetch best-effort follower count from server API and display next to widget
  const [followers, setFollowers] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch('/api/x/followers')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data && data.followers) setFollowers(data.followers);
      })
      .catch(() => {});
    return () => { mounted = false };
  }, []);
  const fallbackFollowers = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_X_FOLLOWERS_FALLBACK || null : null;

  return (
    <footer className="border-t bg-muted/30">
      {/* Social Stats Bar */}
      <div className="border-b bg-primary/5">
        <div className="container mx-auto px-4 md:px-4 py-6">
          <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
            <div className="text-center">
              <div className="mb-1 text-sm font-medium text-muted-foreground">Join Our Community</div>
              <div className="flex items-center justify-center gap-6">
                <div className="group flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-2 shadow-sm">
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground">X</div>
                        <a
                          href="https://x.com/CivicOp_india"
                          className="twitter-follow-button text-sm"
                          data-show-count="true"
                          data-show-screen-name="true"
                        >
                          Follow @CivicOp_india
                        </a>
                        <div className="text-sm text-muted-foreground">
                          {followers ? `${followers} followers` : (fallbackFollowers ? `${fallbackFollowers} followers` : null)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 md:px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-start">
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
                <Link href="/citizens-issue" className="text-muted-foreground transition-colors hover:text-primary">
                  Report Issue
                </Link>
              </li>
                <li>
                  <Link href="/about" className="text-muted-foreground transition-colors hover:text-primary">
                    About
                  </Link>
                </li>
              <li>
                <Link href="/donate" className="text-muted-foreground transition-colors hover:text-primary">
                  Donate
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-muted-foreground transition-colors hover:text-primary" aria-label="Admin (login)" title="Admin (login)">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Join the Beta for CivicOp 2.0</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Get early access to our real-time tracking tools and help shape the future of digital governance.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Request Access
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t">
        <div className="container mx-auto px-4 md:px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>© {new Date().getFullYear()} Civic Opposition of India. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/contact" className="transition-colors hover:text-primary">
                Contact
              </Link>
              <Link href="/privacy-policy" className="transition-colors hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="transition-colors hover:text-primary">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

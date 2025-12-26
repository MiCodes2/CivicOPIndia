"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Home, Activity, Heart, Menu, X, Shield, LayoutDashboard, LogOut, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [followers, setFollowers] = useState<string | null>(null);

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch('/api/x/followers').then(r => r.json()).then((data) => {
      if (!mounted) return;
      if (data && data.followers) setFollowers(data.followers);
    }).catch(() => {});
    return () => { mounted = false };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/activities", label: "Activities", icon: Activity },
    { href: "/about", label: "About", icon: Info },
    { href: "/donate", label: "Donate", icon: Heart },
  ];

  const adminLink = { href: "/admin/login", label: "Admin Login", icon: Shield };

  const socialLinks = [
    { href: "https://x.com/CivicOp_india", label: "X", icon: X },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Civic Opposition Logo"
              width={56}
              height={56}
              className="rounded-md"
            />
            <span className="hidden text-lg font-semibold md:inline-block">
              Civic Opposition of India
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-6 md:flex">
              <div className="w-64">
                {/* Search in desktop nav */}
                {/* @ts-ignore */}
                <SearchBar />
              </div>
              
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              
              {/* Admin Links - Desktop */}
              {user ? (
                <>
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center space-x-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <Link
                  href={adminLink.href}
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  <Shield className="h-4 w-4" />
                  <span>{adminLink.label}</span>
                </Link>
              )}
              
              {/* Social Links Divider */}
              <div className="h-6 w-px bg-border" />
              
              {/* Social Media Links */}
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-primary"
                    aria-label={link.label}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>

            {/* Mobile icons inline (compact) - aligned with logo */}
            <div className="flex items-center gap-2 md:hidden">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="text-muted-foreground p-1.5 rounded-full transition-colors hover:bg-gray-100" aria-label={link.label}>
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground p-1.5 rounded-full transition-colors hover:bg-gray-100" aria-label={link.label}>
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}

              <button onClick={() => setShowMobileSearch((s) => !s)} aria-label="Search" className="text-muted-foreground p-1.5 rounded-full transition-colors hover:bg-gray-100">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>


        </div>

        {/* Mobile Search Input (toggled) */}
        {showMobileSearch && (
          <div className="md:hidden mt-2 w-full px-2">
            <div className="w-full">
              {/* @ts-ignore */}
              <SearchBar />
            </div>
          </div>
        )}

        {/* Mobile Navigation */}

      </div>
    </nav>
  );
}

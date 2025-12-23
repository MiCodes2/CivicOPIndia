"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Home, Activity, Heart, Menu, X, Youtube, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/activities", label: "Activities", icon: Activity },
    { href: "/donate", label: "Donate", icon: Heart },
  ];

  const socialLinks = [
    { href: "https://www.youtube.com/@CivicOPIndia", label: "YouTube", icon: Youtube },
    { href: "https://x.com/CivicOp_india", label: "Twitter", icon: Twitter },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.jpg"
              alt="Civic Opposition Logo"
              width={56}
              height={56}
              className="rounded-md"
            />
            <span className="hidden text-lg font-semibold md:inline-block">
              Civic Opposition
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-6 md:flex">
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

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              
              {/* Social Links in Mobile Menu */}
              <div className="border-t pt-3">
                <div className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                  Follow Us
                </div>
                <div className="flex gap-4 px-3">
                  {socialLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                        aria-label={link.label}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

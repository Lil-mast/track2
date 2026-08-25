"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 mt-4"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between rounded-[1.35rem] border border-white/10 bg-[#42170d]/95 px-5 py-3 shadow-[0_20px_60px_rgba(74,24,12,0.18)] backdrop-blur-xl">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-xl font-semibold tracking-[-0.04em] text-[#fff8ed]"
          >
            <span
              aria-hidden="true"
              className="grid h-8 w-8 grid-cols-2 gap-1 rounded-lg bg-[#f36b21] p-1.5"
            >
              <span className="rounded-sm bg-[#fff8ed]" />
              <span className="rounded-sm bg-[#fff8ed]/55" />
              <span className="rounded-sm bg-[#fff8ed]/55" />
              <span className="rounded-sm bg-[#fff8ed]" />
            </span>
            Recovery<span className="text-[#ff9b55]">AI</span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#e8b99d] transition-colors hover:bg-white/5 hover:text-[#fff8ed]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#e8b99d] transition-colors hover:text-[#fff8ed]"
            >
              Sign in
            </Link>
            <Button
              size="sm"
              className="bg-[#fff3dc] text-[#42170d] shadow-none hover:bg-white"
              asChild
            >
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="p-1 text-[#e8b99d] hover:text-[#fff8ed] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="mt-2 flex flex-col gap-1 rounded-[1.35rem] border border-white/10 bg-[#42170d]/95 px-5 py-4 shadow-2xl backdrop-blur-xl md:hidden">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#f2cfb9] transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              <Link
                href="/dashboard"
                className="px-3 py-2 text-sm font-medium text-[#e8b99d] transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <Button
                size="sm"
                className="bg-[#fff3dc] text-[#42170d] shadow-none hover:bg-white"
                asChild
              >
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

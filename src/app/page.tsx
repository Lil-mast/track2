"use client";

import { useEffect } from "react";
import { HeroSection } from "@/components/pages/landing/hero-section";
import { TrustedBySection } from "@/components/pages/landing/trusted-by-section";
import { FeaturesSection } from "@/components/pages/landing/features-section";
import { IntelligenceLayerSection } from "@/components/pages/landing/intelligence-layer-section";
import { ApiPreviewSection } from "@/components/pages/landing/api-preview-section";
import { CtaSection } from "@/components/pages/landing/cta-section";
import { FooterSection } from "@/components/pages/landing/footer-section";

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.05 }
    );

    document.querySelectorAll<HTMLElement>(".fade-in-up").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)";
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="antialiased overflow-x-hidden min-h-screen">
      {/* Fixed Backdrop-blur Header matching Framer template */}
      <header className="fixed top-0 left-0 w-full z-50 border-b border-white/[0.05] bg-[#030712]/75 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-extrabold text-base tracking-wider shadow-lg shadow-blue-500/20">
              R
            </span>
            <span className="font-extrabold text-lg text-white tracking-tight">
              RecoveryAI
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {["Platform", "Solutions", "Developers", "Pricing"].map((item) => (
              <a
                key={item}
                className="text-sm font-semibold text-slate-400 hover:text-white transition-colors py-2"
                href="#"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-white font-semibold text-sm transition-colors px-4 py-2">
              Book Demo
            </button>
            <button className="relative inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-md shadow-blue-500/10 hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Sections */}
      <main className="pt-20">
        <div className="fade-in-up">
          <HeroSection />
        </div>
        <div className="fade-in-up" style={{ transitionDelay: "0.1s" }}>
          <TrustedBySection />
        </div>
        <div className="fade-in-up" style={{ transitionDelay: "0.2s" }}>
          <FeaturesSection />
        </div>
        <div className="fade-in-up" style={{ transitionDelay: "0.3s" }}>
          <IntelligenceLayerSection />
        </div>
        <div className="fade-in-up" style={{ transitionDelay: "0.4s" }}>
          <ApiPreviewSection />
        </div>
        <div className="fade-in-up" style={{ transitionDelay: "0.5s" }}>
          <CtaSection />
        </div>
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}

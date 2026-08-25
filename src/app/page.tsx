import { LandingNav } from "@/components/landing/nav";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { TrustedBySection } from "@/components/landing/trusted-by-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { LightLines } from "@/components/ui/light-lines";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-[#42170d]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <LightLines
          className="h-full min-h-screen w-full"
          gradientFrom="#f36b21"
          gradientTo="#e85a12"
          lightColor="#fff8ed"
          lineColor="#fff8ed"
          linesOpacity={0.12}
          lightsOpacity={0.8}
          speedMultiplier={1}
        />
      </div>

      <div className="relative z-10">
        <LandingNav />
        <main>
          <HeroSection />
          <TrustedBySection />
          <FeaturesSection />
          <CtaSection />
        </main>
        <FooterSection />
      </div>
    </div>
  );
}

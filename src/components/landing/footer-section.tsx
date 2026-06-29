import Image from "next/image";
import Link from "next/link";

const productLinks = ["API Platform", "Nova Inference", "Smart Link Engine", "Pricing"];
const legalLinks = ["Privacy Policy", "Terms of Service", "Security"];
const companyLinks = ["Status", "Contact", "About Us", "Press Kit"];

export function FooterSection() {
  return (
    <footer className="relative bg-[#030712] w-full pt-20 pb-12 border-t border-white/[0.05] z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-6 gap-10 mb-16">
        {/* Brand */}
        <div className="col-span-2">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/images/logo.png"
              alt="RecoveryAI"
              width={130}
              height={36}
              className="h-8 w-auto"
            />
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
            Empowering modern fintech platforms with context-aware,
            hyper-personalized recovery automation.
          </p>
          <div className="flex gap-3">
            {["X", "Li", "GH", "@"].map((icon) => (
              <a
                key={icon}
                href="#"
                aria-label={icon}
                className="w-8 h-8 rounded-full border border-white/[0.08] bg-slate-950/40 hover:bg-blue-500/10 hover:border-blue-500/30 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-all duration-300 text-xs font-bold"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Product */}
        <div className="col-span-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Product
          </h4>
          <ul className="flex flex-col gap-3 text-xs">
            {productLinks.map((link) => (
              <li key={link}>
                <a
                  className="text-slate-400 hover:text-white transition-colors"
                  href="#"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div className="col-span-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Legal &amp; Security
          </h4>
          <ul className="flex flex-col gap-3 text-xs">
            {legalLinks.map((link) => (
              <li key={link}>
                <a
                  className="text-slate-400 hover:text-white transition-colors"
                  href="#"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div className="col-span-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Company
          </h4>
          <ul className="flex flex-col gap-3 text-xs">
            {companyLinks.map((link) => (
              <li key={link}>
                <a
                  className="text-slate-400 hover:text-white transition-colors"
                  href="#"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-white/[0.05] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[11px] text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} RecoveryAI Inc. All rights
          reserved. Built for high-performance enterprise teams.
        </p>
        <div className="flex gap-6 text-[11px] text-slate-500">
          <a href="#" className="hover:text-white transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms of Use
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Cookie Preferences
          </a>
        </div>
      </div>
    </footer>
  );
}

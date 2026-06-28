const legalLinks = ["Privacy Policy", "Terms of Service", "Security"];
const companyLinks = ["Status", "Contact", "About Us", "Press Kit"];
const productLinks = ["API Platform", "Nova Inference", "Smart Link Engine", "Pricing"];

export function FooterSection() {
  return (
    <footer className="relative bg-[#030712] w-full pt-20 pb-12 border-t border-white/[0.05] z-10 overflow-hidden">
      {/* Footer grid */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-6 gap-10 mb-16">
        {/* Brand Column */}
        <div className="md:col-span-2">
          <div className="text-xl font-extrabold text-white tracking-tight mb-4">
            RecoveryAI
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
            Empowering modern fintech platforms with context-aware, hyper-personalized recovery automation.
          </p>
          <div className="flex gap-4">
            {["facebook", "sports_esports", "public", "alternate_email"].map((icon) => (
              <a
                key={icon}
                href="#"
                className="w-8 h-8 rounded-full border border-white/[0.08] bg-slate-950/40 hover:bg-blue-500/10 hover:border-blue-500/30 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-all duration-300"
              >
                <span className="material-symbols-outlined text-sm">{icon}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Product Columns */}
        <div className="col-span-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Product
          </h4>
          <ul className="flex flex-col gap-3 text-xs">
            {productLinks.map((link) => (
              <li key={link}>
                <a className="text-slate-400 hover:text-white transition-colors" href="#">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal & Security */}
        <div className="col-span-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Legal &amp; Security
          </h4>
          <ul className="flex flex-col gap-3 text-xs">
            {legalLinks.map((link) => (
              <li key={link}>
                <a className="text-slate-400 hover:text-white transition-colors" href="#">
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
                <a className="text-slate-400 hover:text-white transition-colors" href="#">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 border-t border-white/[0.05] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[11px] text-slate-500 font-medium">
          © {new Date().getFullYear()} RecoveryAI Inc. All rights reserved. Built for high-performance enterprise teams.
        </p>
        <div className="flex gap-6 text-[11px] text-slate-500">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
          <a href="#" className="hover:text-white transition-colors">Cookie Preferences</a>
        </div>
      </div>
    </footer>
  );
}

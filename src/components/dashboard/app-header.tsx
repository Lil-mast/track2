import Link from "next/link";
import { Bell, Search, LogOut } from "lucide-react";

export function AppHeader() {
  return (
    <header className="h-14 border-b border-border bg-background/60 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      {/* Search */}
      <div className="relative hidden sm:flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Search loans, borrowers..."
          className="pl-9 pr-4 h-8 w-64 text-sm bg-muted/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="sm:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            JS
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-foreground leading-none">
              J. Smith
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Admin</p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 pl-3 border-l border-border text-muted-foreground hover:text-red-400 transition-colors text-xs font-medium"
          aria-label="Log out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Log Out</span>
        </Link>
      </div>
    </header>
  );
}

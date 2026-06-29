"use client";

import Link from "next/link";
import { Bell, Search, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <div className="flex-1 flex items-center gap-4 pl-10 lg:pl-0">
        {title && (
          <h2 className="text-lg font-semibold hidden sm:block">{title}</h2>
        )}
        <div className="relative max-w-md flex-1 hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search borrowers, loans, recommendations..."
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        <div className="flex items-center gap-2 pl-2 border-l">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              JS
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">Jennifer Smith</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recovery Manager
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" asChild className="hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-destructive pl-2 border-l rounded-none">
          <Link href="/">
            <LogOut className="h-4 w-4" />
            <span className="text-xs">Sign Out</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild className="sm:hidden text-muted-foreground hover:text-destructive">
          <Link href="/" aria-label="Sign Out">
            <LogOut className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

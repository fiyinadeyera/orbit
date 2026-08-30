import React from 'react';
import { Link, useLocation } from 'wouter';
import { Mic, Users, Network, Sparkles, Search, LogOut } from 'lucide-react';
import { authFetch } from '@/lib-auth';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'New Entry', icon: Mic },
  { href: '/people', label: 'People', icon: Users },
  { href: '/graph', label: 'Network Map', icon: Network },
  { href: '/intros', label: 'Intros', icon: Sparkles },
  { href: '/search', label: 'Search', icon: Search },
];

function isActiveHref(location: string, href: string) {
  if (href === '/') return location === '/';
  return location === href || location.startsWith(`${href}/`);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:w-64 border-r border-border bg-card/50 px-4 py-6 flex-col shrink-0 sticky top-0 md:h-[100dvh]">
        <div className="mb-8 px-3">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-primary">
            Orbit
          </Link>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">Your Network Universe</p>
        </div>

        <div className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveHref(location, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <button
          className="mt-auto flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={async () => { await authFetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/'); }}
          type="button"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </nav>

      {/* Mobile top brand bar */}
      <div className="md:hidden sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur px-4 py-3">
        <Link href="/" className="font-serif text-lg font-bold tracking-tight text-primary">
          Orbit
        </Link>
      </div>

      <main className="flex-1 w-full flex flex-col h-full overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 lg:p-12 pb-28 md:pb-24">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar — kept easily reachable with the thumb, like a native app */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveHref(location, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "fill-primary/10")} />
                <span className={cn("text-[11px]", isActive ? "font-semibold" : "font-medium")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


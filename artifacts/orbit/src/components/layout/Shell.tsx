import React from 'react';
import { Link, useLocation } from 'wouter';
import { BookOpen, Users, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'Journal', icon: BookOpen },
    { href: '/people', label: 'People', icon: Users },
    { href: '/graph', label: 'Network', icon: Network },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      <nav className="md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/50 px-4 py-6 flex flex-col shrink-0 sticky top-0 md:h-[100dvh]">
        <div className="mb-8 px-3 hidden md:block">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-primary">
            Orbit
          </Link>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">Relationship Intelligence</p>
        </div>
        
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            
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
      </nav>

      <main className="flex-1 w-full flex flex-col h-full overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 lg:p-12 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}
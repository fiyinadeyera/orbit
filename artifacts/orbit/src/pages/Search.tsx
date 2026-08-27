import React, { useState } from 'react';
import { useListPeople } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import { Search as SearchIcon, MapPin, Briefcase } from 'lucide-react';

export default function Search() {
  const [search, setSearch] = useState('');
  const hasQuery = search.trim().length > 0;
  const { data: people = [], isLoading } = useListPeople({ search: search || undefined });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Search</h1>
        <p className="text-muted-foreground mt-1">Find someone by name, company, or tag.</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, or tags..."
          className="pl-9 h-12 rounded-xl bg-card border-border/50"
        />
      </div>

      {!hasQuery ? (
        <div className="py-16 text-center text-muted-foreground">
          Start typing to search your network.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)
          ) : people.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 border border-dashed rounded-xl">
              No matches for "{search}".
            </div>
          ) : (
            people.map((person) => (
              <Link key={person.id} href={`/people/${person.id}`}>
                <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full flex flex-col group">
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start gap-4 mb-3">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {person.name}
                        </h3>
                        {person.role || person.company ? (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Briefcase className="w-3 h-3" />
                            {[person.role, person.company].filter(Boolean).join(' at ')}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {person.location && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                        <MapPin className="w-3 h-3" /> {person.location}
                      </div>
                    )}

                    <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
                      {person.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] font-normal px-2 bg-secondary/50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  useListPeople,
  useCreatePerson,
  useListReconnects,
  useAskNetwork,
  getListPeopleQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { getInitials } from '@/lib/utils';
import { Search, Plus, Clock, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

type CardPerson = {
  id: string;
  name: string;
  role?: string | null;
  company?: string | null;
  location?: string | null;
  tags?: string[] | null;
};

// One card shape, used for both the full people list and the people an answer
// refers to (which carry an extra reason line).
function PersonCard({ person, reason }: { person: CardPerson; reason?: string }) {
  const title = [person.role, person.company].filter(Boolean).join(' at ');
  const tags = person.tags ?? [];

  return (
    <Link href={`/people/${person.id}`}>
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
              {title && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{title}</p>
              )}
            </div>
          </div>

          {reason ? (
            <p className="text-sm text-foreground/80 leading-relaxed mt-4">{reason}</p>
          ) : (
            <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
              {tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] font-normal px-2 bg-secondary/50">
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="secondary" className="text-[10px] font-normal px-1 bg-secondary/30">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function People() {
  const [question, setQuestion] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: people = [], isLoading } = useListPeople({});
  const { data: reconnects = [], isLoading: isLoadingReconnects } = useListReconnects();
  const ask = useAskNetwork();
  const createMutation = useCreatePerson();

  const asked = Boolean(ask.data) && !ask.isPending;

  const submitAsk = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || ask.isPending) return;
    ask.mutate({ data: { question: q } });
  };

  const clearAsk = () => {
    setQuestion('');
    ask.reset();
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      company: (formData.get('company') as string) || undefined,
      role: (formData.get('role') as string) || undefined,
      location: (formData.get('location') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    };

    createMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast.success('Person added.');
          setIsAddOpen(false);
          queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
        },
        onError: () => {
          toast.error("Couldn't add that person. Try again.");
        },
      },
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">People</h1>
          <p className="text-muted-foreground mt-1">Everyone Orbit remembers, with the context that matters.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 rounded-full shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add manually
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add a person</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input name="name" required placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  <Input name="company" placeholder="Acme Inc." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input name="role" placeholder="Designer" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input name="location" placeholder="San Francisco" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">What should Orbit remember?</label>
                <Input name="notes" placeholder="Met at a conference..." />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save person'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Time to reconnect
        </h2>

        <div className="space-y-3">
          {isLoadingReconnects ? (
            Array(2)
              .fill(0)
              .map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)
          ) : reconnects.length === 0 ? (
            <Card className="bg-transparent border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Everyone is up to date. Orbit will flag the right time to reconnect.
              </CardContent>
            </Card>
          ) : (
            reconnects.slice(0, 4).map((item) => (
              <Link key={item.person.id} href={`/people/${item.person.id}`} className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-background">
                      <AvatarFallback>{getInitials(item.person.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                        {item.person.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.person.company || item.person.role || 'No recent context'}
                      </p>
                    </div>
                    <div className="text-xs text-right shrink-0">
                      <span className="text-muted-foreground block">{item.daysSinceContact} days</span>
                      <span className="text-primary font-medium">ago</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Ask your network. Same column as the old search, now a plain-language box. */}
      <form onSubmit={submitAsk} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything..."
          className="pl-9 pr-10 h-12 rounded-xl bg-card border-border/50"
        />
        {question && (
          <button
            type="button"
            onClick={clearAsk}
            aria-label="Clear"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {ask.isPending ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center text-center gap-4">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          <p className="text-lg font-serif text-foreground">Asking your network...</p>
        </div>
      ) : asked && ask.data ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <p className="text-base text-foreground leading-relaxed">{ask.data.answer}</p>
            </CardContent>
          </Card>

          {ask.data.matches.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ask.data.matches.map((match) => (
                <PersonCard key={match.person.id} person={match.person} reason={match.reason} />
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" onClick={clearAsk}>
            Show all people
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)
          ) : people.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 border border-dashed rounded-xl">
              No people yet. Capture someone, or add one manually.
            </div>
          ) : (
            people.map((person) => <PersonCard key={person.id} person={person} />)
          )}
        </div>
      )}
    </div>
  );
}

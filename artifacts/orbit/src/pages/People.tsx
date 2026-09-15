import React, { useState } from 'react';
import {
  useListPeople,
  useCreatePerson,
  useUpdatePerson,
  useListReconnects,
  useAskNetwork,
  getListPeopleQueryKey,
  getListReconnectsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { cn, getInitials } from '@/lib/utils';
import { Search, Plus, Clock, Sparkles, X, Bell, BellOff, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ImportContactsDialog } from '@/components/ImportContactsDialog';
import { track } from '@/lib/track';

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
function PersonCard({
  person,
  reason,
  reminderOn,
  onToggleReminder,
}: {
  person: CardPerson;
  reason?: string;
  reminderOn?: boolean;
  onToggleReminder?: (id: string, next: boolean) => void;
}) {
  const title = [person.role, person.company].filter(Boolean).join(' at ');
  const tags = person.tags ?? [];

  return (
    <Link href={`/people/${person.id}`}>
      <Card className="relative hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full flex flex-col group">
        {onToggleReminder && (
          <button
            type="button"
            aria-label={reminderOn ? 'Mute reconnect reminders' : 'Turn on reconnect reminders'}
            title={reminderOn ? 'Reminders on' : 'Reminders muted'}
            onClick={(e) => {
              // Don't let the click bubble up to the card's navigation link.
              e.preventDefault();
              e.stopPropagation();
              onToggleReminder(person.id, !reminderOn);
            }}
            className={cn(
              'absolute top-2 right-2 z-10 grid place-items-center h-11 w-11 rounded-full transition-colors',
              reminderOn
                ? 'text-primary hover:bg-primary/10'
                : 'text-muted-foreground/50 hover:bg-secondary/60 hover:text-muted-foreground',
            )}
          >
            {reminderOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
        )}
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex items-start gap-4 mb-3 pr-10">
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
  // Optimistic reminder state keyed by person id, so the bell flips instantly
  // while the update is in flight (and is reconciled by the refetch).
  const [reminderOverrides, setReminderOverrides] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: people = [], isLoading, isError: peopleError } = useListPeople({});
  const updateReminder = useUpdatePerson();

  const toggleReminder = (id: string, next: boolean) => {
    setReminderOverrides((prev) => ({ ...prev, [id]: next }));
    updateReminder.mutate(
      { id, data: { reminderEnabled: next } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
        },
        onError: () => {
          setReminderOverrides((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
          toast.error("Couldn't update reminders. Try again.");
        },
      },
    );
  };

  const reminderState = (p: { id: string; reminderEnabled?: boolean | null }) =>
    reminderOverrides[p.id] ?? p.reminderEnabled ?? true;

  // People the user just marked reconnected, hidden from the list immediately
  // while the update lands (reconciled by the refetch).
  const [justReconnected, setJustReconnected] = useState<Set<string>>(new Set());
  const markReconnect = useUpdatePerson();

  const markReconnected = (id: string) => {
    setJustReconnected((prev) => new Set(prev).add(id));
    markReconnect.mutate(
      { id, data: { lastContacted: new Date().toISOString() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReconnectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
        },
        onError: () => {
          setJustReconnected((prev) => {
            const copy = new Set(prev);
            copy.delete(id);
            return copy;
          });
          toast.error("Couldn't mark reconnected. Try again.");
        },
      },
    );
  };
  const {
    data: reconnects = [],
    isLoading: isLoadingReconnects,
    isError: reconnectsError,
  } = useListReconnects();
  const ask = useAskNetwork();
  const createMutation = useCreatePerson();

  const visibleReconnects = reconnects
    .filter((item) => !justReconnected.has(item.person.id))
    .slice(0, 4);

  const asked = Boolean(ask.data) && !ask.isPending;

  const submitAsk = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || ask.isPending) return;
    track('ask_used');
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

        <div className="flex items-center gap-2 shrink-0">
        <ImportContactsDialog />
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-sm">
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
          ) : reconnectsError ? (
            <Card className="bg-transparent border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Couldn't load reconnects. Check your connection and try again.
              </CardContent>
            </Card>
          ) : visibleReconnects.length === 0 ? (
            <Card className="bg-transparent border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Everyone is up to date. Orbit will flag the right time to reconnect.
              </CardContent>
            </Card>
          ) : (
            visibleReconnects.map((item) => (
              <Link key={item.person.id} href={`/people/${item.person.id}`} className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-3">
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
                    <button
                      type="button"
                      aria-label={`Mark reconnected with ${item.person.name}`}
                      title="Mark reconnected"
                      onClick={(e) => {
                        // Stay on the list, don't follow the card's link.
                        e.preventDefault();
                        e.stopPropagation();
                        markReconnected(item.person.id);
                      }}
                      className="shrink-0 grid place-items-center h-11 w-11 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
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
      ) : ask.isError ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Couldn't answer that right now.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const q = question.trim();
                if (q) ask.mutate({ data: { question: q } });
              }}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : asked && ask.data ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <p className="text-base text-foreground leading-relaxed">{ask.data.answer}</p>
            </CardContent>
          </Card>

          {ask.data.matches.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ask.data.matches.map((match) => (
                <PersonCard
                  key={match.person.id}
                  person={match.person}
                  reason={match.reason}
                  reminderOn={reminderState(match.person)}
                  onToggleReminder={toggleReminder}
                />
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" onClick={clearAsk}>
            Show all people
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)
          ) : peopleError ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 border border-dashed rounded-xl">
              Couldn't load your people. Check your connection and try again.
            </div>
          ) : people.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 border border-dashed rounded-xl">
              No people yet. Capture someone, or add one manually.
            </div>
          ) : (
            people.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                reminderOn={reminderState(person)}
                onToggleReminder={toggleReminder}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

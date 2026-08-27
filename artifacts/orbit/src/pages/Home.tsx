import React, { useState, useRef } from 'react';
import { useCaptureNote, useListReconnects, useListPeople, getListPeopleQueryKey, getListReconnectsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, formatDate, getCurrentCoordinates } from '@/lib/utils';
import { Send, Clock, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';

export default function Home() {
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();
  const captureMutation = useCaptureNote();
  
  const { data: reconnects = [], isLoading: isLoadingReconnects } = useListReconnects();
  const { data: recentPeople = [], isLoading: isLoadingRecent } = useListPeople();

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    const coordinates = await getCurrentCoordinates();

    captureMutation.mutate({ data: { note, ...coordinates } }, {
      onSuccess: (res) => {
        toast.success(res.created ? `Added ${res.person.name} to your network.` : `Logged interaction with ${res.person.name}.`);
        setNote('');
        queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListReconnectsQueryKey() });
      },
      onError: () => {
        toast.error('Failed to save note. Please try again.');
      }
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Capture Area */}
      <section className="space-y-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">What do you want to remember?</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Jot down who you met, what you talked about, or any context you want to keep. We'll organize it for you,
            using today's date and — if your browser allows it — your current location to help fill in the gaps.
          </p>
        </div>
        
        <form onSubmit={handleCapture} className="relative group">
          <Textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Met Sarah at the coffee shop today. She just started a new job as a designer at Stripe..."
            className="min-h-[160px] pb-14 text-base md:text-lg bg-card border-border focus-visible:ring-primary/30 transition-all rounded-xl shadow-sm hover:shadow-md"
            disabled={captureMutation.isPending}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Natural language
            </span>
            <Button 
              type="submit" 
              size="sm" 
              className="rounded-full px-4 font-medium"
              disabled={!note.trim() || captureMutation.isPending}
            >
              {captureMutation.isPending ? 'Saving...' : 'Save memory'}
              {!captureMutation.isPending && <Send className="w-3 h-3 ml-2" />}
            </Button>
          </div>
        </form>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Reconnect Prompts */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> 
            Time to reconnect
          </h2>
          
          <div className="space-y-3">
            {isLoadingReconnects ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
              ))
            ) : reconnects.length === 0 ? (
              <Card className="bg-transparent border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  Your network is fresh. Check back later for reconnect suggestions.
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

        {/* Recent People */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-semibold">Recent connections</h2>
            <Link href="/people" className="text-sm text-primary hover:underline font-medium">
              View all
            </Link>
          </div>
          
          <div className="space-y-3">
            {isLoadingRecent ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
              ))
            ) : recentPeople.length === 0 ? (
              <Card className="bg-transparent border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  Start typing in the box above to build your network.
                </CardContent>
              </Card>
            ) : (
              recentPeople.slice(0, 4).map((person) => (
                <Link key={person.id} href={`/people/${person.id}`} className="block">
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-background">
                        <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                          {person.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          Added {formatDate(person.createdAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

    </div>
  );
}
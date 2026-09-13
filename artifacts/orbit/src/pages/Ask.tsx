import { useState } from 'react';
import { Link } from 'wouter';
import { useAskNetwork } from '@workspace/api-client-react';
import type { AskMatch } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Search as SearchIcon, Sparkles, MapPin, Briefcase } from 'lucide-react';

const EXAMPLES = [
  'Who do I know in machine learning?',
  'Who could introduce me to a designer?',
  'Who is hiring right now?',
];

function MatchCard({ match }: { match: AskMatch }) {
  const { person, reason } = match;
  const title = [person.role, person.company].filter(Boolean).join(' at ');

  return (
    <Link href={`/people/${person.id}`}>
      <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full flex flex-col group">
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {person.name}
              </h3>
              {title && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <Briefcase className="w-3 h-3" />
                  {title}
                </p>
              )}
              {person.location && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {person.location}
                </p>
              )}
            </div>
          </div>
          {reason && (
            <p className="text-sm text-foreground/80 leading-relaxed mt-4">{reason}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Ask() {
  const [question, setQuestion] = useState('');
  const ask = useAskNetwork();
  const result = ask.data;

  function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed || ask.isPending) return;
    ask.mutate({ data: { question: trimmed } });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Ask</h1>
        <p className="text-muted-foreground mt-1">
          Ask your network a question in plain language.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Who do I know in fintech?"
            className="pl-9 h-12 rounded-xl bg-card border-border/50"
          />
        </div>
        <Button
          type="submit"
          disabled={!question.trim() || ask.isPending}
          className="h-12 px-5 rounded-xl shrink-0"
        >
          {ask.isPending ? 'Asking...' : 'Ask'}
        </Button>
      </form>

      {ask.isIdle && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setQuestion(ex);
                submit(ex);
              }}
              className="text-xs text-muted-foreground rounded-full border border-border/60 px-3 py-2 hover:bg-muted transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {ask.isPending && (
        <div className="min-h-[30vh] flex flex-col items-center justify-center text-center gap-4">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          <p className="text-lg font-serif text-foreground">Asking your network...</p>
        </div>
      )}

      {ask.isError && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Couldn't answer that right now.</p>
            <Button variant="outline" size="sm" onClick={() => submit(question)}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {result && !ask.isPending && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <p className="text-base text-foreground leading-relaxed">{result.answer}</p>
            </CardContent>
          </Card>

          {result.matches.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {result.matches.map((match) => (
                <MatchCard key={match.person.id} match={match} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

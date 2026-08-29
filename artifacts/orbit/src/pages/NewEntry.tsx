import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  useExtractCapture,
  useConfirmCapture,
  useListPeople,
  getListPeopleQueryKey,
  getListReconnectsQueryKey,
} from '@workspace/api-client-react';
import { useVoiceRecorder } from '@workspace/integrations-openai-ai-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { getCurrentCoordinates, type Coordinates } from '@/lib/utils';
import { Mic, Square, X, Keyboard, Sparkles, Check, Loader2, UserCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

type Stage = 'idle' | 'recording' | 'typing' | 'processing' | 'review';

type ReviewFields = {
  name: string;
  company: string;
  role: string;
  location: string;
  context: string;
  status: string;
  interests: string;
  connectedTo: string;
};

const emptyReview: ReviewFields = {
  name: '',
  company: '',
  role: '',
  location: '',
  context: '',
  status: '',
  interests: '',
  connectedTo: '',
};

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function csrfToken(): string | undefined {
  const match = document.cookie
    .split('; ')
    .find((part) => part.startsWith('orbit_csrf='))
    ?.slice('orbit_csrf='.length);
  return match ? decodeURIComponent(match) : undefined;
}

async function transcribeAudio(blob: Blob): Promise<string> {
  // This is a raw (non-generated) upload, so it must attach the same session
  // cookie and CSRF header the API now requires on every state-changing route.
  const headers: Record<string, string> = {
    'Content-Type': blob.type || 'application/octet-stream',
  };
  const csrf = csrfToken();
  if (csrf) headers['x-csrf-token'] = csrf;

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers,
    body: blob,
    credentials: 'include',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Could not transcribe your recording.');
  }
  const data = await response.json();
  return data.text as string;
}

export default function NewEntry() {
  const [stage, setStage] = useState<Stage>('idle');
  const [typedNote, setTypedNote] = useState('');
  const [rawNote, setRawNote] = useState('');
  const [review, setReview] = useState<ReviewFields>(emptyReview);
  const [entryDate, setEntryDate] = useState<string>('');
  const [saveAsNewPerson, setSaveAsNewPerson] = useState(false);
  const [duration, setDuration] = useState(0);
  const coordsRef = useRef<Coordinates | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, navigate] = useLocation();

  const queryClient = useQueryClient();
  const recorder = useVoiceRecorder();
  const extractMutation = useExtractCapture();
  const confirmMutation = useConfirmCapture();
  // Kept fresh independent of the extraction result so the "existing
  // contact" warning stays accurate even after the user edits the name on
  // the review screen — the AI's original guess (based on the transcribed
  // name) can otherwise go stale the moment the name field changes.
  const { data: people } = useListPeople();
  const trimmedName = review.name.trim();
  const matchedPerson = trimmedName
    ? people?.find((person) => person.name === trimmedName)
    : undefined;
  const isExistingPerson = Boolean(matchedPerson);

  // If the matched contact changes (including changing to/from "no match")
  // because the user edited the name, drop any earlier "save as new"
  // choice — it was a decision about a different match and shouldn't
  // silently carry over.
  const matchedPersonId = matchedPerson?.id;
  useEffect(() => {
    setSaveAsNewPerson(false);
  }, [matchedPersonId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetToIdle = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStage('idle');
    setDuration(0);
    setTypedNote('');
    setRawNote('');
    setReview(emptyReview);
    setSaveAsNewPerson(false);
    coordsRef.current = undefined;
  };

  const runExtraction = async (note: string) => {
    setRawNote(note);
    setStage('processing');
    extractMutation.mutate(
      { data: { note } },
      {
        onSuccess: (res) => {
          const e = res.extracted;
          setReview({
            name: e.name ?? '',
            company: e.company ?? '',
            role: e.role ?? '',
            location: e.location ?? '',
            context: e.context ?? '',
            status: e.status ?? '',
            interests: (e.interests ?? []).join(', '),
            connectedTo: (e.connectedTo ?? []).join(', '),
          });
          setEntryDate(e.date);
          setSaveAsNewPerson(false);
          setStage('review');
        },
        onError: () => {
          toast.error("Couldn't organize that entry. Please try again.");
          resetToIdle();
        },
      },
    );
  };

  const handleRecordClick = async () => {
    try {
      coordsRef.current = undefined;
      getCurrentCoordinates().then((coords) => {
        coordsRef.current = coords;
      });
      await recorder.startRecording();
      setStage('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      toast.error("Couldn't access your microphone. You can type instead.");
      setStage('typing');
    }
  };

  const handleStop = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const blob = await recorder.stopRecording();
      setStage('processing');
      const text = await transcribeAudio(blob);
      if (!text.trim()) {
        toast.error("Didn't catch that — please try again or type instead.");
        resetToIdle();
        return;
      }
      await runExtraction(text);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not process the recording.');
      resetToIdle();
    }
  };

  const handleCancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorder.state === 'recording') {
      recorder.stopRecording().catch(() => {});
    }
    resetToIdle();
  };

  const handleTypeInstead = () => {
    coordsRef.current = undefined;
    getCurrentCoordinates().then((coords) => {
      coordsRef.current = coords;
    });
    setStage('typing');
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedNote.trim()) return;
    runExtraction(typedNote.trim());
  };

  const handleSave = () => {
    if (!review.name.trim()) {
      toast.error('A name is required before saving.');
      return;
    }
    confirmMutation.mutate(
      {
        data: {
          name: review.name.trim(),
          company: review.company.trim() || undefined,
          role: review.role.trim() || undefined,
          location: review.location.trim() || undefined,
          context: review.context.trim() || undefined,
          status: review.status.trim() || undefined,
          interests: splitList(review.interests),
          connectedTo: splitList(review.connectedTo),
          date: entryDate,
          rawNote,
          forceNew: isExistingPerson && saveAsNewPerson,
          ...coordsRef.current,
        },
      },
      {
        onSuccess: (res) => {
          toast.success(
            res.created ? `Added ${res.person.name} to your network.` : `Logged interaction with ${res.person.name}.`,
          );
          queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListReconnectsQueryKey() });
          resetToIdle();
          navigate(`/people/${res.person.id}`);
        },
        onError: () => {
          toast.error('Failed to save. Please try again.');
        },
      },
    );
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (stage === 'review') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Review before saving</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Orbit pulled out these details — edit anything that's off.
          </p>
        </div>

        {isExistingPerson && (
          <Card className={saveAsNewPerson ? 'border-dashed' : 'border-primary/40 bg-primary/5'}>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-3">
                {saveAsNewPerson ? (
                  <UserPlus className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                ) : (
                  <UserCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  {saveAsNewPerson ? (
                    <p className="text-foreground">
                      This will be saved as a <span className="font-medium">new, separate contact</span> named{' '}
                      {review.name || 'this person'}, even though someone with that name already exists.
                    </p>
                  ) : (
                    <p className="text-foreground">
                      This will be added to your existing contact:{' '}
                      <span className="font-medium">{review.name || 'this person'}</span>.
                    </p>
                  )}
                  <p className="text-muted-foreground mt-1">
                    Not the same person? You can save this as a distinct contact instead.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSaveAsNewPerson((v) => !v)}
              >
                {saveAsNewPerson ? 'Actually, merge with the existing contact' : "This is a different person — save as new"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground italic leading-relaxed">
            "{rawNote}"
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="field-name">Name</Label>
              <Input
                id="field-name"
                value={review.name}
                onChange={(e) => setReview((r) => ({ ...r, name: e.target.value }))}
                placeholder="Who did you talk to?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="field-role">Role / company</Label>
              <div className="flex gap-2">
                <Input
                  id="field-role"
                  value={review.role}
                  onChange={(e) => setReview((r) => ({ ...r, role: e.target.value }))}
                  placeholder="Role"
                />
                <Input
                  value={review.company}
                  onChange={(e) => setReview((r) => ({ ...r, company: e.target.value }))}
                  placeholder="Company"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="field-context">Context</Label>
            <Textarea
              id="field-context"
              value={review.context}
              onChange={(e) => setReview((r) => ({ ...r, context: e.target.value }))}
              placeholder="How you met, what you talked about..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="field-location">Location</Label>
              <Input
                id="field-location"
                value={review.location}
                onChange={(e) => setReview((r) => ({ ...r, location: e.target.value }))}
                placeholder="Where you met"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="field-status">Looking for</Label>
              <Input
                id="field-status"
                value={review.status}
                onChange={(e) => setReview((r) => ({ ...r, status: e.target.value }))}
                placeholder="e.g. Hiring designers"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="field-interests">Interests / tags</Label>
            <Input
              id="field-interests"
              value={review.interests}
              onChange={(e) => setReview((r) => ({ ...r, interests: e.target.value }))}
              placeholder="Comma separated, e.g. hiking, jazz, startups"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="field-connected">Connected to</Label>
            <Input
              id="field-connected"
              value={review.connectedTo}
              onChange={(e) => setReview((r) => ({ ...r, connectedTo: e.target.value }))}
              placeholder="Comma separated names mentioned in this note"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2 sticky bottom-0 bg-background/95 backdrop-blur pb-2">
          <Button variant="outline" className="flex-1" onClick={resetToIdle} disabled={confirmMutation.isPending}>
            Discard
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={confirmMutation.isPending}>
            {confirmMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>
    );
  }

  if (stage === 'processing') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-500">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-lg font-serif text-foreground">Orbit is organizing this...</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Pulling out names, context, and connections from what you shared.
        </p>
      </div>
    );
  }

  if (stage === 'recording') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-1.5 text-destructive">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium tracking-wide uppercase">Listening</span>
        </div>

        <div className="flex items-end gap-1 h-16">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-primary/70 animate-pulse"
              style={{
                height: `${20 + ((i * 37) % 60)}%`,
                animationDelay: `${i * 90}ms`,
                animationDuration: '900ms',
              }}
            />
          ))}
        </div>

        <p className="text-3xl font-serif font-semibold tabular-nums text-foreground">
          {formatDuration(duration)}
        </p>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={handleCancelRecording}
            aria-label="Cancel recording"
          >
            <X className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            className="h-20 w-20 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg"
            onClick={handleStop}
            aria-label="Stop recording"
          >
            <Square className="w-7 h-7 fill-current" />
          </Button>
          <div className="h-14 w-14" />
        </div>
      </div>
    );
  }

  if (stage === 'typing') {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center gap-4 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Type what happened</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Write it however feels natural — Orbit will organize it for you.
          </p>
        </div>
        <form onSubmit={handleTypedSubmit} className="space-y-4">
          <Textarea
            autoFocus
            value={typedNote}
            onChange={(e) => setTypedNote(e.target.value)}
            placeholder="e.g. Met Sarah at the coffee shop today. She just started a new job as a designer at Stripe..."
            className="min-h-[180px] text-base bg-card rounded-xl"
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={resetToIdle}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!typedNote.trim()}>
              <Sparkles className="w-4 h-4 mr-2" />
              Organize it
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center text-center gap-3 animate-in fade-in duration-500">
      <h1 className="text-3xl font-serif font-bold text-foreground">What happened?</h1>
      <p className="text-muted-foreground max-w-xs">
        Tap record and tell Orbit who you met and what you talked about.
      </p>

      <button
        onClick={handleRecordClick}
        className="mt-8 h-28 w-28 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Start recording"
      >
        <Mic className="w-11 h-11" />
      </button>

      <button
        onClick={handleTypeInstead}
        className="mt-6 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 underline underline-offset-4"
      >
        <Keyboard className="w-3.5 h-3.5" />
        Type instead
      </button>
    </div>
  );
}

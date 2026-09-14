import { useState } from 'react';
import { useImportContacts, getListPeopleQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  GOOGLE_CONTACTS_SCOPE,
  fetchGoogleContacts,
  getGoogleClientId,
  type ImportCandidate,
} from '@/lib/googleContacts';
import { requestGoogleAccessToken } from '@/lib/googleAuth';

type Step = 'start' | 'loading' | 'review' | 'importing';

export function ImportContactsDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('start');
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const importMutation = useImportContacts();
  const clientId = getGoogleClientId();

  const reset = () => {
    setStep('start');
    setCandidates([]);
    setSelected(new Set());
    setError(null);
  };

  const connectGoogle = async () => {
    if (!clientId) return;
    setError(null);
    setStep('loading');
    try {
      const token = await requestGoogleAccessToken(clientId, GOOGLE_CONTACTS_SCOPE);
      const found = await fetchGoogleContacts(token);
      // Dedupe by name for a clean review list; the server dedupes again on import.
      const byKey = new Map<string, ImportCandidate>();
      for (const candidate of found) if (!byKey.has(candidate.key)) byKey.set(candidate.key, candidate);
      const unique = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
      setCandidates(unique);
      setSelected(new Set(unique.map((c) => c.key)));
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your Google contacts.');
      setStep('start');
    }
  };

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allSelected = candidates.length > 0 && selected.size === candidates.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(candidates.map((c) => c.key)));

  const runImport = () => {
    const chosen = candidates
      .filter((c) => selected.has(c.key))
      .map(({ name, email, phone, company, role }) => ({ name, email, phone, company, role }));
    if (chosen.length === 0) return;

    setStep('importing');
    importMutation.mutate(
      { data: { contacts: chosen } },
      {
        onSuccess: (res) => {
          const skippedNote = res.skipped ? `, skipped ${res.skipped} already in Orbit` : '';
          toast.success(
            `Imported ${res.imported} contact${res.imported === 1 ? '' : 's'}${skippedNote}.`,
          );
          queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
          setOpen(false);
          reset();
        },
        onError: () => {
          setError('Import failed. Try again.');
          setStep('review');
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="shrink-0 rounded-full">
          <Upload className="w-4 h-4 mr-2" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Import contacts</DialogTitle>
        </DialogHeader>

        {!clientId ? (
          <div className="py-6 text-center text-sm text-muted-foreground space-y-2">
            <p>Google import isn't configured yet.</p>
            <p className="text-xs">Add a Google OAuth client id to switch it on (see GOOGLE_SETUP.md).</p>
          </div>
        ) : step === 'start' ? (
          <div className="py-6 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Bring people in from Google. Orbit skips anyone already in your network.
            </p>
            <Button onClick={connectGoogle} className="rounded-full">
              Continue with Google
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        ) : step === 'loading' ? (
          <div className="py-10 flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            Loading your Google contacts...
          </div>
        ) : step === 'review' ? (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {selected.size} of {candidates.length} selected
              </span>
              <button
                type="button"
                onClick={toggleAll}
                className="underline underline-offset-2 hover:text-foreground"
              >
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="max-h-[45vh] overflow-y-auto -mx-2 px-2 divide-y divide-border">
              {candidates.map((candidate) => {
                const subtitle = [candidate.role, candidate.company].filter(Boolean).join(' at ');
                return (
                  <label key={candidate.key} className="flex items-center gap-3 py-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(candidate.key)}
                      onChange={() => toggle(candidate.key)}
                      className="h-4 w-4 accent-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{candidate.name}</p>
                      {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
                    </div>
                  </label>
                );
              })}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="ghost" onClick={reset}>
                Back
              </Button>
              <Button onClick={runImport} disabled={selected.size === 0}>
                Import {selected.size || ''}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-10 flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            Importing {selected.size} contact{selected.size === 1 ? '' : 's'}...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

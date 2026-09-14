import { useEffect, useState } from 'react';
import { authFetch, type AuthUser } from '@/lib-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { pushSupported, isPushEnabled, enablePush, disablePush } from '@/lib/push';

type PushState = 'checking' | 'unsupported' | 'off' | 'on' | 'working';

export default function Account() {
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushState>('checking');
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    authFetch<{ user: AuthUser }>('/api/auth/me')
      .then((r) => setEmail(r.user?.email ?? null))
      .catch(() => setEmail(null));
  }, []);

  useEffect(() => {
    if (!pushSupported()) {
      setPushState('unsupported');
      return;
    }
    isPushEnabled().then((on) => setPushState(on ? 'on' : 'off'));
  }, []);

  const togglePush = async () => {
    const wasOn = pushState === 'on';
    setPushError(null);
    setPushState('working');
    try {
      if (wasOn) {
        await disablePush();
        setPushState('off');
      } else {
        const ok = await enablePush();
        setPushState(ok ? 'on' : 'off');
        if (!ok) setPushError('Allow notifications in your browser to get reminders.');
      }
    } catch {
      setPushState(wasOn ? 'on' : 'off');
      setPushError('Something went wrong. Try again.');
    }
  };

  const signOut = async () => {
    await authFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.assign('/');
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      await authFetch('/api/auth/delete-account', { method: 'POST' });
      window.location.assign('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete your account.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-lg">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Account</h1>
        {email && <p className="text-muted-foreground mt-1">{email}</p>}
      </div>

      <Card>
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-xs text-muted-foreground">End your session on this device.</p>
          </div>
          <Button variant="outline" onClick={signOut} className="shrink-0">
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Reconnect reminders</p>
            <p className="text-xs text-muted-foreground">
              A push notification when people are due for a reconnect.
            </p>
            {pushError && <p className="text-xs text-destructive mt-1">{pushError}</p>}
          </div>
          {pushState === 'unsupported' ? (
            <span className="text-xs text-muted-foreground shrink-0">Not supported here</span>
          ) : (
            <Button
              variant="outline"
              className="shrink-0"
              disabled={pushState === 'working' || pushState === 'checking'}
              onClick={togglePush}
            >
              {pushState === 'on' ? 'Turn off' : pushState === 'working' ? 'Working...' : 'Turn on'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="p-5 space-y-3">
          <div>
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently deletes your account and everyone in your network. This cannot be undone.
            </p>
          </div>

          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) {
                setConfirm('');
                setError(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This permanently deletes your account and all your people, connections, and notes.
                This cannot be undone. Type{' '}
                <span className="font-mono font-medium text-foreground">DELETE</span> to confirm.
              </p>
              <Input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="DELETE"
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={confirm.trim().toUpperCase() !== 'DELETE' || deleting}
                  onClick={deleteAccount}
                >
                  {deleting ? 'Deleting...' : 'Delete account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authFetch, type AuthUser } from '@/lib-auth';

const DEMO_EMAIL = 'demo@orbit.app';
const DEMO_PASSWORD = 'orbitdemo123';

export default function Login({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() =>
    new URLSearchParams(window.location.search).get('auth_error') === 'google'
      ? "Google sign-in didn't finish. Try again."
      : '',
  );
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await authFetch<{ user: AuthUser }>(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      onAuthenticated(result.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin() {
    setBusy(true);
    setError('');
    try {
      const result = await authFetch<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
      });
      onAuthenticated(result.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">Orbit</CardTitle>
          <CardDescription>{mode === 'login' ? 'Your network, connected and useful.' : 'Create your private Orbit account.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 rounded-xl border-2 border-primary bg-primary/10 p-3 shadow-sm">
            <p className="mb-2 text-center text-sm font-semibold text-foreground">Judging Orbit? Start here.</p>
            <Button className="h-12 w-full text-base font-semibold shadow-md" type="button" disabled={busy} onClick={demoLogin}>
              {busy ? 'Opening demo…' : 'Open the live demo'}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">No sign-up needed. First load can take up to a minute if the app is waking up, thanks for your patience.</p>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={12} required value={password} onChange={(e) => setPassword(e.target.value)} />
              {mode === 'signup' && <p className="text-xs text-muted-foreground">At least 12 characters.</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={busy} type="submit">{busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
            <Button className="w-full" type="button" variant="ghost" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Create an account' : 'I already have an account'}
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button className="w-full" type="button" variant="outline" disabled={busy} onClick={() => { window.location.href = '/api/auth/google'; }}>
              Continue with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

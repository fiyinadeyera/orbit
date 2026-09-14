import { useEffect, useState } from 'react';
import { authFetch } from '@/lib-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Summary = {
  totalUsers: number;
  activatedUsers: number;
  returnedUsers: number;
  eventsByName: { name: string; count: number }[];
  dailyActive: { date: string; users: number }[];
};

type State = 'loading' | 'ready' | 'forbidden' | 'error';

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-3xl font-serif font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [state, setState] = useState<State>('loading');
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const resetDemo = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setResetting(true);
    try {
      await authFetch('/api/demo/reset', { method: 'POST' });
      window.location.reload();
    } catch {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  useEffect(() => {
    let active = true;
    authFetch<Summary>('/api/analytics/summary')
      .then((data) => {
        if (!active) return;
        setSummary(data);
        setState('ready');
      })
      .catch((e) => {
        if (!active) return;
        setState(String(e?.message ?? e).toLowerCase().includes('authorized') ? 'forbidden' : 'error');
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === 'loading') return <p className="text-sm text-muted-foreground">Loading analytics...</p>;
  if (state === 'forbidden')
    return <p className="text-sm text-muted-foreground">This page is for the Orbit owner only.</p>;
  if (state === 'error' || !summary)
    return <p className="text-sm text-muted-foreground">Could not load analytics.</p>;

  const pct = (n: number) => (summary.totalUsers ? Math.round((n / summary.totalUsers) * 100) : 0);
  const maxDaily = Math.max(1, ...summary.dailyActive.map((d) => d.users));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Activation and return, the signal that matters.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total users" value={summary.totalUsers} />
        <Stat
          label="Activated"
          value={summary.activatedUsers}
          sub={`${pct(summary.activatedUsers)}% captured someone`}
        />
        <Stat
          label="Came back"
          value={summary.returnedUsers}
          sub={`${pct(summary.returnedUsers)}% active on 2+ days`}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-serif font-semibold">Daily active users (14 days)</h2>
        {summary.dailyActive.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="space-y-1.5">
            {summary.dailyActive.map((d) => (
              <div key={d.date} className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{d.date}</span>
                <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary/70"
                    style={{ width: `${(d.users / maxDaily) * 100}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums w-6 text-right">{d.users}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-serif font-semibold">Events (30 days)</h2>
        {summary.eventsByName.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {summary.eventsByName.map((e) => (
              <div key={e.name} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-muted-foreground">{e.name}</span>
                <span className="tabular-nums font-medium">{e.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-serif font-semibold">Demo data</h2>
        <p className="text-sm text-muted-foreground">
          Reset your network to a curated demo set. This deletes your current people first.
        </p>
        <Button
          variant={confirmReset ? 'destructive' : 'outline'}
          size="sm"
          disabled={resetting}
          onClick={resetDemo}
        >
          {resetting ? 'Resetting...' : confirmReset ? 'Click again to confirm' : 'Reset to demo data'}
        </Button>
      </section>
    </div>
  );
}

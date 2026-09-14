import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Shell } from '@/components/layout/Shell';
import NewEntry from '@/pages/NewEntry';
import People from '@/pages/People';
import PersonDetail from '@/pages/PersonDetail';
import GraphView from '@/pages/Graph';
import Intros from '@/pages/Intros';
import Search from '@/pages/Search';
import NotFound from '@/pages/not-found';
import Login from '@/pages/Login';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Analytics from '@/pages/Analytics';
import Account from '@/pages/Account';
import { track } from '@/lib/track';
import { authFetch, type AuthUser } from '@/lib-auth';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={NewEntry} />
          <Route path="/people" component={People} />
          <Route path="/people/:id" component={PersonDetail} />
          <Route path="/graph" component={GraphView} />
          <Route path="/intros" component={Intros} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/account" component={Account} />
          <Route path="/search" component={Search} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authFetch<{ user: AuthUser }>('/api/auth/me')
      .then((result) => {
        setUser(result.user);
        if (result.user) track('app_opened');
      })
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  // Public page: reachable without login, so the Google OAuth consent screen
  // can link to it and anyone can read it before signing in.
  if (window.location.pathname.replace(/\/+$/, '').endsWith('/privacy')) {
    return <PrivacyPolicy />;
  }

  if (checking) {
    return <div className="min-h-[100dvh] grid place-items-center text-sm text-muted-foreground">Opening Orbit…</div>;
  }
  if (!user) return <Login onAuthenticated={setUser} />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

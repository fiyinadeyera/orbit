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
import Ask from '@/pages/Ask';
import Search from '@/pages/Search';
import NotFound from '@/pages/not-found';
import Login from '@/pages/Login';
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
          <Route path="/ask" component={Ask} />
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
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

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

import { authFetch } from '@/lib-auth';

/**
 * Record a product event. Fire-and-forget: analytics must never disrupt the UI,
 * so failures (offline, logged out, blocked) are swallowed.
 */
export function track(name: string, props?: Record<string, unknown>): void {
  void authFetch('/api/events', {
    method: 'POST',
    body: JSON.stringify({ name, props }),
  }).catch(() => {});
}

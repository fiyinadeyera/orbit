import { authFetch } from '@/lib-auth';

export function pushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/** True if this browser currently has an active push subscription. */
export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return Boolean(sub);
}

/** Ask permission, subscribe, and register the subscription with the server. */
export async function enablePush(): Promise<boolean> {
  if (!pushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const { key } = await authFetch<{ key: string | null }>('/api/push/public-key');
  if (!key) return false;

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
  });

  await authFetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(sub.toJSON()),
  });
  return true;
}

/** Unsubscribe this browser and tell the server to forget it. */
export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await authFetch('/api/push/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe();
}

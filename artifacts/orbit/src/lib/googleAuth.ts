// Browser-side Google OAuth via Google Identity Services (GIS). We only need a
// short-lived access token to read contacts once, so this uses the GIS token
// flow (not a sign-in / identity flow). The script is loaded on demand.

const GIS_SRC = 'https://accounts.google.com/gsi/client';

type TokenResponse = { access_token?: string; error?: string };
type TokenClient = { requestAccessToken: (options?: { prompt?: string }) => void };

type GoogleOAuth2 = {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type?: string; message?: string }) => void;
  }): TokenClient;
};

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google sign-in.'));
    document.head.appendChild(script);
  });
  return gisPromise;
}

/**
 * Prompt the user to grant contacts access and resolve with an access token.
 * Rejects if they cancel or the grant fails.
 */
export async function requestGoogleAccessToken(
  clientId: string,
  scope: string,
): Promise<string> {
  await loadGis();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error('Google sign-in is unavailable right now.');

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope,
      callback: (response) => {
        if (response.access_token) resolve(response.access_token);
        else reject(new Error(response.error || 'Google authorization was cancelled.'));
      },
      error_callback: (error) =>
        reject(new Error(error.message || 'Google authorization failed.')),
    });
    client.requestAccessToken();
  });
}

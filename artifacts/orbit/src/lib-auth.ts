export type AuthUser = { id: string; email: string };

function cookie(name: string) {
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && typeof init.body === "string") headers.set("content-type", "application/json");
  const csrf = cookie("orbit_csrf");
  if (csrf && !["GET", "HEAD"].includes((init.method ?? "GET").toUpperCase())) {
    headers.set("x-csrf-token", decodeURIComponent(csrf));
  }
  const response = await fetch(path, { ...init, headers, credentials: "include" });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "Request failed.");
  return data as T;
}

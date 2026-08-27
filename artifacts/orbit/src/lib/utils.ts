import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  if (!name) return ""
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Unknown"
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return dateStr
  }
}

export type Coordinates = { latitude: number; longitude: number }

/**
 * Best-effort read of the browser's current position. Resolves to
 * `undefined` (never rejects) if geolocation is unsupported, the user
 * denies permission, or the lookup times out — capture should never be
 * blocked or fail because location wasn't available.
 */
export function getCurrentCoordinates(): Promise<Coordinates | undefined> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(undefined)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => resolve(undefined),
      { timeout: 4000, maximumAge: 5 * 60 * 1000 },
    )
  })
}

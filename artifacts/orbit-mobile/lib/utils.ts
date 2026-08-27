/** Returns up to two uppercase initials from a full name. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Formats an ISO date string as "Jan 5, 2026". Returns '' for invalid input. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Formats an ISO date string as a short "Jan 5" (no year) for compact rows. */
export function formatShortDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Formats a day count (e.g. days since last contact) as "3d", "2mo", "1y". */
export function formatDaysCompact(days: number): string {
  if (days <= 0) return 'today';
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.round(months / 12);
  return `${years}y`;
}

/** Joins non-empty parts with a separator, skipping nullish/empty values. */
export function joinTruthy(parts: Array<string | null | undefined>, separator = ' \u00b7 '): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(separator);
}

/** Today's date as an ISO date string (YYYY-MM-DD), used as a form default. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

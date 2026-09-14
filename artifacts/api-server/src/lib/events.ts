import { randomUUID } from "node:crypto";
import { eq, gte, sql } from "drizzle-orm";
import { db, eventsTable, usersTable } from "@workspace/db";

/**
 * Record a product-analytics event. Best-effort by design: analytics must never
 * break or slow a real request, so failures are swallowed.
 */
export async function recordEvent(
  userId: string,
  name: string,
  props?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(eventsTable).values({
      id: randomUUID(),
      userId,
      name,
      props: props ?? null,
    });
  } catch {
    // ignore
  }
}

/** Only the configured admin email may read cross-user product metrics. */
export function isAnalyticsAdmin(email: string): boolean {
  const admin = process.env.ANALYTICS_ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(admin) && email.trim().toLowerCase() === admin;
}

export type AnalyticsSummary = {
  totalUsers: number;
  /** Users who have captured at least one person. */
  activatedUsers: number;
  /** Users active on two or more distinct days: the "came back" signal. */
  returnedUsers: number;
  /** Event counts by name over the last 30 days, most frequent first. */
  eventsByName: { name: string; count: number }[];
  /** Distinct active users per day over the last 14 days. */
  dailyActive: { date: string; users: number }[];
};

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [{ count: totalUsers }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);

  const [{ count: activatedUsers }] = await db
    .select({ count: sql<number>`count(distinct ${eventsTable.userId})::int` })
    .from(eventsTable)
    .where(eq(eventsTable.name, "person_captured"));

  // Days-active per user, then count how many reached two or more.
  const perUser = await db
    .select({ days: sql<number>`count(distinct date(${eventsTable.createdAt}))::int` })
    .from(eventsTable)
    .groupBy(eventsTable.userId);
  const returnedUsers = perUser.filter((row) => row.days >= 2).length;

  const eventsByName = await db
    .select({ name: eventsTable.name, count: sql<number>`count(*)::int` })
    .from(eventsTable)
    .where(gte(eventsTable.createdAt, since30))
    .groupBy(eventsTable.name)
    .orderBy(sql`count(*) desc`);

  const dailyActive = await db
    .select({
      date: sql<string>`to_char(date(${eventsTable.createdAt}), 'YYYY-MM-DD')`,
      users: sql<number>`count(distinct ${eventsTable.userId})::int`,
    })
    .from(eventsTable)
    .where(gte(eventsTable.createdAt, since14))
    .groupBy(sql`date(${eventsTable.createdAt})`)
    .orderBy(sql`date(${eventsTable.createdAt})`);

  return { totalUsers, activatedUsers, returnedUsers, eventsByName, dailyActive };
}

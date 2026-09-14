import webpush from "web-push";
import { eq, sql } from "drizzle-orm";
import { db, peopleTable, pushSubscriptionsTable } from "@workspace/db";

// Web Push is configured lazily from VAPID env vars. Without them, sending is a
// no-op so the app runs fine before the keys are set.
let configured: boolean | null = null;
function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:notifications@orbit.app",
    publicKey,
    privateKey,
  );
  configured = true;
  return true;
}

export function isPushConfigured(): boolean {
  return ensureConfigured();
}

export type PushPayload = { title: string; body: string; url?: string };

/** Send a notification to every device a user has subscribed. Dead
 * subscriptions (gone/expired) are pruned. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  const subs = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, userId));

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await db
            .delete(pushSubscriptionsTable)
            .where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
        }
      }
    }),
  );
}

/**
 * Nudge every subscribed user who has people they haven't spoken to in 30+ days.
 * Meant to run on a schedule. Returns a small summary for the caller to log.
 */
export async function runReconnectNudges(): Promise<{ nudged: number }> {
  if (!ensureConfigured()) return { nudged: 0 };

  // Reconnect-due count per owner (last contact, or creation date, 30+ days ago).
  const dueRows = await db
    .select({ ownerId: peopleTable.ownerId, due: sql<number>`count(*)::int` })
    .from(peopleTable)
    .where(
      sql`COALESCE(${peopleTable.lastContacted}, ${peopleTable.createdAt}::date) <= CURRENT_DATE - 30`,
    )
    .groupBy(peopleTable.ownerId);

  const subscribed = new Set(
    (await db.selectDistinct({ userId: pushSubscriptionsTable.userId }).from(pushSubscriptionsTable)).map(
      (r) => r.userId,
    ),
  );

  let nudged = 0;
  for (const { ownerId, due } of dueRows) {
    if (due <= 0 || !subscribed.has(ownerId)) continue;
    await sendPushToUser(ownerId, {
      title: "Time to reconnect",
      body: `You have ${due} ${due === 1 ? "person" : "people"} to reconnect with.`,
      url: "/people",
    });
    nudged += 1;
  }

  return { nudged };
}

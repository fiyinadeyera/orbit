import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { currentUser } from "../middleware/auth";

const router: IRouter = Router();

// The VAPID public key the browser needs to subscribe. Served from the API so
// there is one place to configure it (orbit-api env), no separate web env var.
router.get("/push/public-key", (_req, res): void => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY ?? null });
});

// Save (or refresh) a Web Push subscription for the signed-in user.
router.post("/push/subscribe", async (req, res): Promise<void> => {
  const sub = req.body as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  const endpoint = typeof sub?.endpoint === "string" ? sub.endpoint : "";
  const p256dh = typeof sub?.keys?.p256dh === "string" ? sub.keys.p256dh : "";
  const auth = typeof sub?.keys?.auth === "string" ? sub.keys.auth : "";
  if (!endpoint || !p256dh || !auth) {
    res.status(400).json({ error: "Invalid subscription." });
    return;
  }

  const userId = currentUser(res).id;
  await db
    .insert(pushSubscriptionsTable)
    .values({ id: randomUUID(), userId, endpoint, p256dh, auth })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: { userId, p256dh, auth },
    });

  res.sendStatus(204);
});

// Remove a subscription (browser opted out).
router.post("/push/unsubscribe", async (req, res): Promise<void> => {
  const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint : "";
  if (!endpoint) {
    res.status(400).json({ error: "Missing endpoint." });
    return;
  }
  const userId = currentUser(res).id;
  await db
    .delete(pushSubscriptionsTable)
    .where(
      and(
        eq(pushSubscriptionsTable.endpoint, endpoint),
        eq(pushSubscriptionsTable.userId, userId),
      ),
    );
  res.sendStatus(204);
});

export default router;

import { Router, type IRouter } from "express";
import { runReconnectNudges } from "../lib/webpush";

const router: IRouter = Router();

// Triggered by an external scheduler (a GitHub Actions cron), not a user, so it
// is gated by a shared secret rather than a session.
router.post("/cron/reconnect-nudges", async (req, res): Promise<void> => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.get("x-cron-secret") !== secret) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  try {
    const result = await runReconnectNudges();
    res.json(result);
  } catch (err) {
    req.log.warn({ err }, "Reconnect nudges failed");
    res.status(500).json({ error: "Nudge run failed." });
  }
});

export default router;

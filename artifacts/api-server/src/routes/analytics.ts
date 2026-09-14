import { Router, type IRouter } from "express";
import { currentUser } from "../middleware/auth";
import { getAnalyticsSummary, isAnalyticsAdmin, recordEvent } from "../lib/events";

const router: IRouter = Router();

// Record a client-side product event (app opened, graph opened, ask used, ...).
// Fire-and-forget from the client; best-effort on the server.
router.post("/events", async (req, res): Promise<void> => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name || name.length > 64) {
    res.status(400).json({ error: "Invalid event." });
    return;
  }
  const props =
    req.body?.props && typeof req.body.props === "object" ? req.body.props : undefined;

  await recordEvent(currentUser(res).id, name, props);
  res.status(204).end();
});

// Cross-user product metrics. Admin-only (ANALYTICS_ADMIN_EMAIL).
router.get("/analytics/summary", async (_req, res): Promise<void> => {
  if (!isAnalyticsAdmin(currentUser(res).email)) {
    res.status(403).json({ error: "Not authorized." });
    return;
  }
  res.json(await getAnalyticsSummary());
});

export default router;

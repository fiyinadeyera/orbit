import { Router, type IRouter } from "express";
import { currentUser } from "../middleware/auth";
import { isAnalyticsAdmin } from "../lib/events";
import { resetDemoData } from "../lib/demo";

const router: IRouter = Router();

// Reset the owner's own network to the curated demo set. Owner-only (reuses the
// analytics admin gate), since it wipes data before reseeding.
router.post("/demo/reset", async (req, res): Promise<void> => {
  const user = currentUser(res);
  if (!isAnalyticsAdmin(user.email)) {
    res.status(403).json({ error: "Not authorized." });
    return;
  }
  try {
    const result = await resetDemoData(user.id);
    res.json(result);
  } catch (err) {
    req.log.warn({ err }, "Demo reset failed");
    res.status(500).json({ error: "Reset failed." });
  }
});

export default router;

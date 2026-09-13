import { Router, type IRouter } from "express";
import { ListIntrosResponse } from "@workspace/api-zod";
import { currentUser } from "../middleware/auth";
import { getIntros } from "../lib/intros-service";

const router: IRouter = Router();

// Proactive introductions: the highest likely-mutual-value pairings across the
// network. Served from a per-owner cache (see intros-service) so the page opens
// instantly and the LLM runs in the background, not on the request. Read-only.
router.get("/intros", async (req, res): Promise<void> => {
  const ownerId = currentUser(res).id;
  try {
    const suggestions = await getIntros(ownerId);
    res.json(ListIntrosResponse.parse(suggestions));
  } catch (error) {
    req.log.warn({ error }, "Intro suggestion failed");
    res.status(502).json({
      error:
        error instanceof Error ? error.message : "Could not generate introductions.",
    });
  }
});

export default router;

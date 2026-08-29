import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { ListIntrosResponse } from "@workspace/api-zod";
import { connectionsTable, db, peopleTable } from "@workspace/db";
import { suggestIntros } from "@workspace/intro-engine";
import { completeClaude } from "../lib/claude";
import { currentUser } from "../middleware/auth";
import { connectionToExisting, personToContact } from "../lib/intro-mapping";
import { aiDailyQuota } from "../middleware/rate-limit";

const router: IRouter = Router();

// Proactive introductions: the highest likely-mutual-value pairings across the
// network, scored by the intro engine. Read-only — surfacing suggestions, not
// creating connections.
router.get("/intros", aiDailyQuota, async (req, res): Promise<void> => {
  const ownerId = currentUser(res).id;
  try {
    const [people, connections] = await Promise.all([
      db.select().from(peopleTable).where(eq(peopleTable.ownerId, ownerId)).orderBy(peopleTable.name),
      db.select().from(connectionsTable).where(eq(connectionsTable.ownerId, ownerId)),
    ]);

    const suggestions = await suggestIntros(
      people.map(personToContact),
      connections.map(connectionToExisting),
      completeClaude,
    );

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


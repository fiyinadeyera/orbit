import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { AskNetworkBody, AskNetworkResponse } from "@workspace/api-zod";
import { db, peopleTable, type Person } from "@workspace/db";
import { askNetwork } from "../lib/ask";
import { completeClaude } from "../lib/claude";
import { currentUser } from "../middleware/auth";
import { personToContact } from "../lib/intro-mapping";
import { aiDailyQuota } from "../middleware/rate-limit";

const router: IRouter = Router();

// Strip the owner id from a stored person before it leaves the API. Mirrors the
// serializer used by the people routes.
function personResponse({ ownerId: _ownerId, ...person }: Person) {
  return { ...person, tags: person.tags ?? [] };
}

// Ask your network a natural-language question and get a grounded answer plus
// the specific people it refers to. Read-only: it reasons over the network,
// it does not change it.
router.post("/ask", aiDailyQuota, async (req, res): Promise<void> => {
  const parsed = AskNetworkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ask a question about your network." });
    return;
  }

  const ownerId = currentUser(res).id;
  try {
    const people = await db
      .select()
      .from(peopleTable)
      .where(eq(peopleTable.ownerId, ownerId))
      .orderBy(peopleTable.name);

    const result = await askNetwork(
      parsed.data.question,
      people.map(personToContact),
      completeClaude,
    );

    // Hydrate each matched id back to the full person for display, dropping any
    // the model named that no longer exist.
    const byId = new Map(people.map((person) => [person.id, person]));
    const matches = result.matches.flatMap((match) => {
      const person = byId.get(match.id);
      return person ? [{ person: personResponse(person), reason: match.reason }] : [];
    });

    res.json(AskNetworkResponse.parse({ answer: result.answer, matches }));
  } catch (error) {
    req.log.warn({ error }, "Ask failed");
    res.status(502).json({
      error: error instanceof Error ? error.message : "Could not answer that.",
    });
  }
});

export default router;

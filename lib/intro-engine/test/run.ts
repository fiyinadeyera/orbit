// Independent test for the intro engine: no database, no Orbit, no network,
// no Claude. We hand it fake contacts and a fake `complete` function, then
// check it ranks, filters, and validates correctly. Run:
//   pnpm --filter @workspace/intro-engine exec tsx test/run.ts

import { suggestIntros, type Contact, type CompleteFn } from "../src/index";

const contacts: Contact[] = [
  { id: "marco", name: "Marco", role: "Founder", notes: "Hiring a Head of Product." },
  { id: "sarah", name: "Sarah", role: "Product Leader", notes: "Wants a Head of Product role." },
  { id: "ben", name: "Ben", role: "Recruiter", notes: "Places product talent." },
  { id: "priya", name: "Priya", role: "Angel", notes: "Invests in insurtech." },
];

const connections = [{ aId: "marco", bId: "ben" }]; // already connected

// A stub "LLM" that returns a fixed answer, including three BAD suggestions
// the engine must drop: a self-pair, an already-connected pair, and an
// unknown id. Only the Marco<->Sarah intro is valid.
const fakeComplete: CompleteFn = async () =>
  JSON.stringify({
    intros: [
      { personAId: "marco", personBId: "sarah", score: 95, rationale: "Exact fit.", draftIntro: "Marco, meet Sarah." },
      { personAId: "marco", personBId: "ben", score: 80, rationale: "Already connected.", draftIntro: "x" },
      { personAId: "sarah", personBId: "sarah", score: 70, rationale: "Self pair.", draftIntro: "x" },
      { personAId: "marco", personBId: "ghost", score: 60, rationale: "Unknown person.", draftIntro: "x" },
    ],
  });

const results = await suggestIntros(contacts, connections, fakeComplete);

console.log(`\nEngine returned ${results.length} valid intro(s):`);
for (const r of results) {
  console.log(`  ${r.personA.name} <-> ${r.personB.name}  (score ${r.score})  ${r.rationale}`);
}

const ok =
  results.length === 1 &&
  results[0].personA.id === "marco" &&
  results[0].personB.id === "sarah";

console.log(
  ok
    ? "\nPASS: kept the one valid intro, dropped the already-connected / self / unknown ones.\n"
    : "\nFAIL: unexpected output.\n",
);
process.exit(ok ? 0 : 1);

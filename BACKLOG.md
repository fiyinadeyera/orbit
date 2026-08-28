# Orbit Backlog

Features to build, prioritized MoSCoW-style and grounded in what Orbit already
has. This is a backlog of specs, not a committed sprint order.

## Key insight: Orbit was built out of order

Orbit was built top-down. The exciting top-of-stack work exists (core loop,
network graph, AI intros), but the foundation and ship-readiness layers were
skipped. So the standard 10-stage build sequence is best read here as a **gap
audit**, not a to-do order:

- Core object / relationship / visualization / utility: **done**
- AI (intro engine): **partly done**
- Accounts (the foundation): **missing**
- Reliability, measurement, monetization: **mostly missing**

The near-term goal is a shippable, free Orbit real people can use on their own
data and return to.

**Monetization is parked entirely for now.** The only question that matters
first is getting people to use the app. All pricing/billing/tier work is
deferred until there's real usage to learn from, and is kept out of the active
priorities below on purpose.

---

## MoSCoW

Status = where Orbit is today. Bucket = priority for the "shippable free app" milestone.

| Feature | Status | Bucket |
| --- | --- | --- |
| Core loop: capture → connect → graph → revisit | Done | Must |
| Reliable persistence + cross-device sync (Neon) | Done | Must |
| Accounts, auth, per-user data isolation | Missing | Must |
| Account deletion + privacy policy | Missing | Must |
| Error / empty / loading states (full sweep) | Partial | Must |
| Basic analytics (activation + return funnel) | Missing | Should |
| Reminders / follow-ups | Missing | Should |
| Network import: contacts (done) → Google (scaffolded) → LinkedIn → calendar → email | Contacts shipped; Google awaiting OAuth setup | Should |
| "Looking for" as a first-class field | Missing | Should |
| Scheduled in-app Intros digest | Missing | Could |
| Auto-enrichment / overnight research | Missing | Could |
| Search / filter polish | Partial | Could |
| Subscriptions / billing / paywall | Missing | Won't (yet) |
| Shared / collaborative maps | Missing | Won't |
| Referrals / growth loops | Missing | Won't |
| Reciprocity tracking, life insights | Missing | Won't |
| Watch app, messaging, social feed, gamification | Missing | Won't |

---

## MUST — the four that make Orbit shippable (the skipped foundation)

### 1. Accounts + per-user data isolation
Sign up / log in / log out / recovery, and scope every person, interaction, and
connection to a `userId`. Migrate the current single-user data under one owner.
- Why: Orbit is single-user on one shared DB today. Can't be in two people's
  hands until data is owned and login-gated. Unlocks everything paid later.
- Note: Neon has a built-in Auth product; likely the shortest path.

### 2. Account deletion + privacy policy
In-app account deletion, a privacy policy, and data-use disclosures.
- Why: hard App Store gate. Apple rejects apps that create accounts but can't
  delete them, and review requires the policy + disclosures. Depends on #1.

### 3. Reliability sweep
Loading, empty, and error states on every screen. Intros already has all three;
audit People / Graph / Search / PersonDetail to match.
- Why: without it the app feels broken on a slow network or an empty account.

### 4. Basic analytics
Instrument the core-loop events: person captured, graph opened, returned next day.
- Why: the whole "do people come back?" thesis is unmeasurable without it. This
  is the exact question that decides whether to keep investing.

---

## SHOULD — makes a working product better (post-ship)

- **Reminders / follow-ups**: turn the passive 30-day Reconnects flag into active
  nudges tied to a person or a commitment with a due date. Biggest reopen lever.
- **Network import (ONE of the onboarding on-ramps, not the only one)**: a
  bulk cold-start path that sits alongside — never replaces — voice/text capture.
  Orbit has two co-equal ways to add people:
    - **Capture** (already built): add someone one at a time from a voice note or
      typed note, in the moment you meet them. This is how the private context
      that no data source knows gets in ("Daniel introduced me to Sarah; she's
      raising a seed round"). It stays a primary add path forever.
    - **Import** (this item): bulk-seed from the digital exhaust you already
      generate, for people you won't hand-enter.
  Both feed the same graph. Frame import as "digital exhaust → normalized
  `Contact[]` → graph → intelligence → actions." Each source is just another
  mapper into the engine's existing `Contact` shape (same role as
  `personToContact`), so the intro engine already consumes all of them for free.
  Sequence the sources by value-per-unit-of-trust, not raw value:
    0. **Voice/text capture** — shipped; the always-on manual on-ramp.
    1. **Phone contacts** — SHIPPED (mobile). `POST /api/people/import` is the
       shared bulk-add + dedupe endpoint every source funnels through
       (`routes/import.ts`); the Expo app reads contacts via `expo-contacts`,
       shows a review-and-select screen, and posts the chosen ones
       (`app/import-contacts.tsx`, entry point on the People tab).
    2. **Google contacts** — SCAFFOLDED (mobile), awaiting OAuth setup. The
       frictionless one: "Continue with Google" → People API → same review +
       import endpoint. Code is done (`app/import-google.tsx`,
       `lib/googleContacts.ts`); it needs Google Cloud OAuth client IDs that
       only the account owner can create — see
       `artifacts/orbit-mobile/GOOGLE_SETUP.md`. It's a one-time data grant, not
       an Orbit login, so it does NOT depend on the accounts project. Public
       App Store release will need Google's sensitive-scope verification (not
       blocking dev/TestFlight).
    3. **LinkedIn export** — after Google, as a secondary "option, not the real
       thing". NOTE: there is no OAuth path — "Sign in with LinkedIn" only
       returns the user's own profile, not their connections. So the only route
       is the user exporting `Connections.csv` (name/company/title) and Orbit
       parsing it into the same import endpoint. Basically a CSV import.
    3. **Calendar** — "met X on this date at this event." High value, needs
       OAuth (Google/Microsoft) and therefore Accounts (#5). Higher sensitivity.
    4. **Email** — reconstruct relationship history from follow-ups. Highest
       value, highest trust cost ("let Orbit read your inbox" is an App Store
       privacy-review magnet). Earn it after the cheap sources prove useful.
  Capture stays the layer that adds the private context no source knows
  ("Daniel introduced me to Sarah; she's raising a seed round").
- **"Looking for" first-class field**: capture goals/needs as structured data
  instead of folding into notes. Small change, measurably better intros.

## COULD — nice, not necessary

- **Scheduled in-app Intros digest**: run the engine on a schedule, stash a fresh
  "new intros" set for next open. In-app only, no external push (decided).
- **Auto-enrichment / overnight research**: background job augments contacts from
  public info. The "did its own research overnight" behaviour from the post.
- **Search / filter polish**.

## WON'T (yet) — explicitly excluded until usage is proven

- Subscriptions / billing / paywall (only after recurring value is shown; depends on #1).
- Shared / collaborative maps.
- Referrals / growth loops.
- Reciprocity / favour tracking; personal life insights (post ideas, speculative).
- Apple Watch, messaging, social feed, gamification.

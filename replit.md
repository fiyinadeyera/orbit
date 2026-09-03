# Orbit

Orbit is your personal relationship intelligence layer. Capture anyone in 30 seconds, know when to reconnect, and always know who's in your corner.

Under the hood it works as a relationship-intelligence journal: capture natural-language notes about people you meet, and it extracts who they are, auto-links mentioned connections, and reminds you when it's time to reconnect.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/orbit run dev` — run the Orbit web app
- `pnpm --filter @workspace/orbit-mobile run dev` — run the Orbit Mobile Expo app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec) → `@workspace/api-client-react` (web + mobile share the same generated hooks)
- Web: React + Vite (`artifacts/orbit`)
- Mobile: Expo / React Native (`artifacts/orbit-mobile`), Expo Router, NativeTabs/liquid glass on iOS 26
- Build: esbuild (CJS bundle) for the API server

## Where things live

- `artifacts/api-server/src/routes/orbit.ts` — all `/api/people`, `/api/capture`, `/api/reconnects`, `/api/graph` routes; source of truth for backend behavior (NLP note extraction, reconnect threshold, graph nodes/edges).
- `lib/intro-engine/` — `@workspace/intro-engine`: a source-agnostic introduction-matching engine. Pure TS, zero runtime deps; takes a normalized `Contact[]` + existing connections + an injected `complete(prompt)` LLM function, returns ranked `IntroSuggestion[]` (likely-mutual-value score, rationale, draft intro). Knows nothing about Orbit/HTTP/DB, so it can later run over other corpora (email/Slack/LinkedIn) or its own service with no rewrite.
- `artifacts/api-server/src/routes/intros.ts` — `GET /api/intros`: maps Orbit people/connections into the engine's shape (`lib/intro-mapping.ts`), scores them via Claude (`lib/claude.ts` — same Anthropic integration as extraction), returns suggestions. Read-only; suggests intros, does not create connections.
- `lib/api-spec/openapi.yaml` — the OpenAPI contract both the web and mobile clients are generated from.
- `artifacts/orbit/src/` — web app (wouter router, pages: Home/People/PersonDetail/Graph, `Shell.tsx` nav, `index.css` theme tokens = source of truth for brand palette/fonts/radius).
- `artifacts/orbit-mobile/` — Expo companion app. `constants/colors.ts` mirrors the web app's HSL tokens (converted to hex); `app/(tabs)/` holds the 3 tabs (Journal/People/Network); `app/person/[id].tsx` is the pushed detail screen; `app/person-form.tsx` is the add/edit `formSheet`.

## Architecture decisions

- Orbit Mobile is a separate artifact (not folded into the web app) since it has mobile-only concerns (tabs, Expo Launch/App Store prep) but shares the same backend and OpenAPI-generated client hooks — no backend or schema changes were needed to add it.
- Mobile's palette/typography/radius were derived directly from the web app's `index.css` (no separate design-system artifact exists yet); keep the two in sync manually if either changes.
- `react-native-web`'s `Alert.alert` is a no-op — anywhere a confirm dialog is needed (e.g. delete-person), branch on `Platform.OS === 'web'` to use `window.confirm` instead of assuming `Alert.alert` works everywhere.

## Product

- **Capture**: free-text notes are parsed to extract a person's name/role/company/location/interests and mentioned connections, then upserted.
- **People**: searchable directory with manual add/edit/delete, tags, and full interaction history per person.
- **Reconnects**: surfaces people who haven't been contacted in 30+ days.
- **Intros**: proactively suggests high-mutual-value introductions to make across the network (the "luck surface area" layer), scored and drafted by `@workspace/intro-engine`. Surfaced on the web app's `/intros` tab. Quality scales with how much each person's goals / "looking for" is captured (currently folded into `notes` at capture time, not a first-class field).
- **Network graph**: visualizes people as nodes and inferred connections as edges.
- Available on web (`artifacts/orbit`) and as a native iPhone/Android app via Expo (`artifacts/orbit-mobile`), both backed by the same API.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The dev API server (`artifacts/api-server`) is a separate workflow from the web/mobile artifacts — start it before testing either client end-to-end.
- If you change `lib/api-spec/openapi.yaml`, re-run the Orval codegen (`pnpm --filter @workspace/api-spec run codegen`) so both `artifacts/orbit` and `artifacts/orbit-mobile` pick up the new generated hooks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for mobile-specific conventions (Expo Launch/App Store prep, tabs, sheets, safe areas)

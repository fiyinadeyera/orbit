# Orbit

Orbit is a personal relationship intelligence app built to make capturing a person fast enough to do in the moment. The product rule is simple: a new person should take under 30 seconds to capture.

The app combines a React interface, a TypeScript and Express API, PostgreSQL, and AI-assisted extraction. Claude turns quick notes into structured relationship data, while the wider workspace also includes OpenAI-backed voice transcription and image support.

## What it does

- Captures people and relationship notes with a short, low-friction flow
- Uses AI to extract structured details from unstructured notes
- Keeps contact and relationship data in PostgreSQL
- Includes relationship and introduction features in a minimal interface

## Stack

- React 19, Vite, and TypeScript
- Tailwind CSS
- Express 5 API server
- PostgreSQL with Drizzle ORM
- Claude for note extraction
- OpenAI integrations for voice transcription and image features
- TanStack Query for client-side data access
- pnpm workspaces

## Repository layout

This is a pnpm monorepo:

- `artifacts/orbit` - React web app
- `artifacts/api-server` - Express API server
- `lib/db` - database client, schema, and Drizzle commands
- `lib/api-client-react` - React API client
- `lib/api-zod` - shared API schemas
- `lib/intro-engine` - introduction logic
- `lib/integrations-openai-ai-server` - server-side OpenAI integration
- `lib/integrations-openai-ai-react` - client-side OpenAI integration
- `scripts` - workspace scripts

## Local setup

Orbit requires Node.js, pnpm, and a PostgreSQL database. The workspace enforces pnpm during installation.

```bash
git clone https://github.com/fiyinadeyera/orbit.git
cd orbit
cp .env.example .env
pnpm install
```

Fill in `.env`:

```dotenv
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com
AI_INTEGRATIONS_ANTHROPIC_API_KEY=
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=
BASE_PATH=/
```

Do not commit real credentials.

Push the database schema:

```bash
pnpm --filter @workspace/db push
```

Start the API and web app in separate terminals:

```bash
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/orbit dev
```

The API expects `PORT` to be set. The included `.env.example` uses port `5000`.

## Checks and builds

Run the workspace type checks and production builds from the repository root:

```bash
pnpm run typecheck
pnpm run build
```

# Orbit

Talk to it for 30 seconds after meeting someone. Orbit remembers everything, connects the dots across your entire network, and drafts warm intros between your contacts. Your network stops being a list and starts working for you.

**Live app:** https://orbit-web-xg5f.onrender.com

## Try the demo

Use the one-click demo button on the login screen, or sign in with:

- Email: `demo@orbit.app`
- Password: `orbitdemo123`

The demo account is shared and contains fictional sample data for judges. You can also create a private account with email and password or continue with Google.

## What Orbit does

- **Captures a meeting in your own words.** Record a short voice note or type what happened.
- **Remembers the details.** Orbit transcribes the note and pulls out the person's name, role, company, interests, needs, and follow-ups for you to review.
- **Connects the dots.** The network map shows how people in your network relate to one another.
- **Finds useful introductions.** Orbit spots people who could help each other and drafts a warm intro you can edit and send.
- **Keeps every account separate.** Email-and-password and Google sign-in each open a private workspace backed by PostgreSQL.

## Stack

- React 19, Vite, and TypeScript
- Tailwind CSS
- Express 5 API server
- PostgreSQL with Drizzle ORM
- OpenAI for voice transcription
- Claude for structured extraction and intro drafts
- TanStack Query
- pnpm workspaces

## Repository layout

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

Orbit requires Node.js, pnpm, and PostgreSQL. The workspace enforces pnpm during installation.

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

## Checks and builds

```bash
pnpm run typecheck
pnpm run build
```

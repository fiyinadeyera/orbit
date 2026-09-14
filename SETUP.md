# Orbit setup checklist

Every feature below is already built and deployed. These are the manual
activation steps that need your accounts and secrets (Render env vars, Google
Cloud, GitHub secrets), which is why they are on you rather than done in code.
None of this blocks the app: the core, LinkedIn import, and everything else
already work. These just switch on the extra features.

Do them whenever you like; each is independent.

---

## Already done (no action)

- `events` table (analytics) created in Neon.
- `push_subscriptions` table (web push) created in Neon.
- `sessions_token_hash_unique` constraint (schema drift) applied. No data lost.

---

## Pending

### 1. Analytics dashboard

- **Render → `orbit-api` → Environment**: add `ANALYTICS_ADMIN_EMAIL` = the email
  you log into Orbit with. Save (redeploys).
- Then open `https://orbit-web-xg5f.onrender.com/analytics` (logged in as that
  email). Use the app a little first so there is data.

### 2. Google Contacts import

Full details in `artifacts/orbit-mobile/GOOGLE_SETUP.md` (see the "Web app"
section). Short version:

- **console.cloud.google.com** → your Orbit project → APIs & Services →
  Credentials → **Create OAuth client ID → Web application**.
  - Authorized JavaScript origins: `https://orbit-web-xg5f.onrender.com` and
    `http://localhost:5173`.
  - OAuth consent screen: External, add the `contacts.readonly` scope, add your
    Google address as a test user.
- **Render → `orbit-web` → Environment**: add
  `VITE_GOOGLE_CLIENT_ID` = the client id. Redeploy.
- Then: People → Import → Continue with Google.
- (LinkedIn import already works with no setup.)

### 3. Reconnect push notifications

- **Render → `orbit-api` → Environment**, add:
  - `VAPID_PUBLIC_KEY` = `BGAPUCBwDr4onp-CEGa_8-NDPcUF0p1vls4XGKMLpAL_GURbq7nyedIZfgonWOpVqiVfIMNeBz5ZTY0FrVTGZlE` (public, safe)
  - `VAPID_PRIVATE_KEY` = the private key generated 2026-09-14 (kept out of git;
    it is in the chat, or regenerate, see below). Secret.
  - `VAPID_SUBJECT` = `mailto:your-email@example.com`
  - `CRON_SECRET` = any long random string. Secret.
  - Lost the VAPID keys? Regenerate a fresh pair and set both:
    `node -e "console.log(require('web-push').generateVAPIDKeys())"`
- **GitHub → `fiyinadeyera/orbit` → Settings → Secrets and variables → Actions**:
  add `CRON_SECRET` = the same value as above (lets the scheduled workflow call
  the endpoint).
- Then: **Account → Reconnect reminders → Turn on**. On iPhone, add Orbit to the
  home screen first (iOS only allows web push for installed PWAs).
- Test now: GitHub Actions tab → "Reconnect nudges" → Run workflow.

### 4. Privacy policy contact email

- The `/privacy` page shows a `[your contact email]` placeholder. Give me the
  address and I will drop it in (small code change + deploy).

---

## Optional cleanup

- A plain `drizzle-kit push` now comes back clean (the sessions drift is fixed),
  so schema changes can go through the normal `pnpm --filter @workspace/db run
  push` again.

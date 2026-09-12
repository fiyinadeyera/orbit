import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";
import {
  clearAuthCookies,
  CSRF_COOKIE,
  hashSessionToken,
  newToken,
  readUser,
  requireCsrf,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  setAuthCookies,
} from "../middleware/auth";
import { authRateLimit } from "../middleware/rate-limit";

const router: IRouter = Router();
const scrypt = promisify(scryptCallback);
const BOOTSTRAP_OWNER_ID = "orbit-bootstrap-owner";

// Demo account for hackathon judges: seeded on server start, credentials shown
// on the login screen. It is a normal account, so owner-scoping and the daily
// AI quota apply to it like anyone else.
export const DEMO_EMAIL = "demo@orbit.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "orbitdemo123";

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("base64url")}:${key.toString("base64url")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [algorithm, saltText, keyText] = stored.split(":");
  if (algorithm !== "scrypt" || !saltText || !keyText) return false;
  const expected = Buffer.from(keyText, "base64url");
  const actual = (await scrypt(password, Buffer.from(saltText, "base64url"), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function ensureDemoUser() {
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, DEMO_EMAIL));
  if (existing) return;
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await db
    .insert(usersTable)
    .values({ id: randomUUID(), email: DEMO_EMAIL, passwordHash })
    .onConflictDoNothing({ target: usersTable.email });
}

export async function startSession(userId: string, res: Parameters<typeof setAuthCookies>[0]) {
  const sessionToken = newToken();
  const csrfToken = newToken();
  await db.insert(sessionsTable).values({
    id: randomUUID(),
    userId,
    tokenHash: hashSessionToken(sessionToken),
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
  });
  setAuthCookies(res, sessionToken, csrfToken);
}

router.post("/auth/signup", authRateLimit, async (req, res): Promise<void> => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12) {
    res.status(400).json({ error: "Use a valid email and a password of at least 12 characters." });
    return;
  }

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const bootstrapEmail = normalizeEmail(process.env.BOOTSTRAP_OWNER_EMAIL);
  let userId: string = randomUUID();

  if (bootstrapEmail && email === bootstrapEmail) {
    const [claimed] = await db
      .update(usersTable)
      .set({ email, passwordHash })
      .where(and(eq(usersTable.id, BOOTSTRAP_OWNER_ID), isNull(usersTable.passwordHash)))
      .returning({ id: usersTable.id });
    if (claimed) userId = claimed.id;
    else await db.insert(usersTable).values({ id: userId, email, passwordHash });
  } else {
    await db.insert(usersTable).values({ id: userId, email, passwordHash });
  }

  await startSession(userId, res);
  res.status(201).json({ user: { id: userId, email } });
});

router.post("/auth/login", authRateLimit, async (req, res): Promise<void> => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  await startSession(user.id, res);
  res.json({ user: { id: user.id, email: user.email } });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const user = await readUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  if (!req.cookies?.[CSRF_COOKIE]) setAuthCookies(res, req.cookies[SESSION_COOKIE], newToken());
  res.json({ user });
});

router.post("/auth/logout", requireCsrf, async (req, res): Promise<void> => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string") {
    await db.delete(sessionsTable).where(eq(sessionsTable.tokenHash, hashSessionToken(token)));
  }
  clearAuthCookies(res);
  res.sendStatus(204);
});

export default router;

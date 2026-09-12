import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { authRateLimit } from "../middleware/rate-limit";
import { newToken } from "../middleware/auth";
import { normalizeEmail, startSession } from "./auth";

const router: IRouter = Router();

const GOOGLE_STATE_COOKIE = "orbit_google_state";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;
const BOOTSTRAP_OWNER_ID = "orbit-bootstrap-owner";

// Google sign-in is configured entirely through env vars so the same build can
// run locally, on Render, or on a future domain:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
// The redirect URI must match the Google Cloud OAuth client exactly, e.g.
// https://orbit-web-xg5f.onrender.com/api/auth/google/callback
function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri?.startsWith("https://")) return null;
  return { clientId, clientSecret, redirectUri };
}

router.get("/auth/google", authRateLimit, (req, res): void => {
  const config = googleConfig();
  if (!config) {
    res.status(503).json({ error: "Google sign-in is not configured yet." });
    return;
  }

  const state = newToken();
  res.cookie(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STATE_MAX_AGE_MS,
  });

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/auth/google/callback", authRateLimit, async (req, res): Promise<void> => {
  const fail = () => res.redirect("/?auth_error=google");
  try {
    const config = googleConfig();
    const { code, state } = req.query;
    const cookieState = req.cookies?.[GOOGLE_STATE_COOKIE];
    res.clearCookie(GOOGLE_STATE_COOKIE, { path: "/" });
    if (
      !config ||
      typeof code !== "string" ||
      typeof state !== "string" ||
      typeof cookieState !== "string" ||
      cookieState !== state
    ) {
      fail();
      return;
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) {
      fail();
      return;
    }
    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      fail();
      return;
    }

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileResponse.ok) {
      fail();
      return;
    }
    const profile = (await profileResponse.json()) as {
      email?: string;
      email_verified?: boolean;
    };
    const email = normalizeEmail(profile.email);
    if (!profile.email_verified || !/^\S+@\S+\.\S+$/.test(email)) {
      fail();
      return;
    }

    // Same account rules as email signup: one account per email. An existing
    // email/password account is linked simply by matching the verified email.
    let userId: string;
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existing) {
      userId = existing.id;
    } else {
      userId = randomUUID();
      const bootstrapEmail = normalizeEmail(process.env.BOOTSTRAP_OWNER_EMAIL);
      if (bootstrapEmail && email === bootstrapEmail) {
        const [claimed] = await db
          .update(usersTable)
          .set({ email })
          .where(and(eq(usersTable.id, BOOTSTRAP_OWNER_ID), isNull(usersTable.passwordHash)))
          .returning({ id: usersTable.id });
        if (claimed) userId = claimed.id;
        else await db.insert(usersTable).values({ id: userId, email });
      } else {
        await db.insert(usersTable).values({ id: userId, email });
      }
    }

    await startSession(userId, res);
    res.redirect("/");
  } catch {
    fail();
  }
});

export default router;

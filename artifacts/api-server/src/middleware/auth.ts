import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";

export const SESSION_COOKIE = "orbit_session";
export const CSRF_COOKIE = "orbit_csrf";
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type AuthUser = { id: string; email: string };

const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const newToken = () => randomBytes(32).toString("base64url");

export function setAuthCookies(res: Response, sessionToken: string, csrfToken: string) {
  const secure = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response) {
  const options = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  res.clearCookie(SESSION_COOKIE, { ...options, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...options, httpOnly: false });
}

export async function readUser(req: Request): Promise<AuthUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || token.length < 32) return null;

  const [row] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
    .where(
      and(
        eq(sessionsTable.tokenHash, tokenHash(token)),
        gt(sessionsTable.expiresAt, new Date()),
      ),
    );
  return row ?? null;
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const user = await readUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  res.locals.user = user;
  next();
}

export function currentUser(res: Response): AuthUser {
  return res.locals.user as AuthUser;
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }
  const cookie = req.cookies?.[CSRF_COOKIE];
  const header = req.get("x-csrf-token");
  if (typeof cookie !== "string" || cookie.length < 32 || header !== cookie) {
    res.status(403).json({ error: "Invalid CSRF token." });
    return;
  }
  next();
}

export const hashSessionToken = tokenHash;

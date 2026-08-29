import type { NextFunction, Request, Response } from "express";
import { currentUser } from "./auth";

// Small in-memory rate limiter. No external dependency and no Redis: fine for a
// single-instance beta. Counters live in memory, so they reset on restart —
// acceptable for now; move to a shared store if the app ever runs on more than
// one instance.

type Bucket = { count: number; resetAt: number };

function makeLimiter(
  windowMs: number,
  max: number,
  keyFn: (req: Request, res: Response) => string | null,
  message: string,
) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyFn(req, res);
    if (!key) {
      next();
      return;
    }

    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= max) {
      res.set("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      res.status(429).json({ error: message });
      return;
    }

    bucket.count += 1;
    next();
  };
}

// Auth endpoints: limit by IP to slow password brute-force and signup spam.
export const authRateLimit = makeLimiter(
  15 * 60 * 1000,
  20,
  (req) => req.ip ?? null,
  "Too many attempts. Please wait a few minutes and try again.",
);

// AI endpoints: cap per signed-in user per day so one account cannot run up the
// OpenAI/Anthropic bill. A voice capture costs two (transcribe + extract).
export const aiDailyQuota = makeLimiter(
  24 * 60 * 60 * 1000,
  100,
  (_req, res) => currentUser(res)?.id ?? null,
  "You've reached today's limit for AI features. It resets in 24 hours.",
);

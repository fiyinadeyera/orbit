import express, { Router, type IRouter } from "express";
import { ensureCompatibleFormat, speechToText } from "@workspace/integrations-openai-ai-server/audio";
import { aiDailyQuota } from "../middleware/rate-limit";

const router: IRouter = Router();

// Raw binary upload: the client posts the recorded audio blob directly as
// the request body (no multipart wrapper, no JSON — this bypasses the
// zod/orval-generated client the way streaming endpoints do, since neither
// tool models binary payloads well).
router.post(
  "/transcribe",
  aiDailyQuota,
  express.raw({ type: "*/*", limit: "25mb" }),
  async (req, res): Promise<void> => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: "No audio data received." });
      return;
    }

    try {
      const { buffer, format } = await ensureCompatibleFormat(req.body);
      const text = await speechToText(buffer, format);
      res.json({ text: text.trim() });
    } catch (error) {
      req.log.warn({ error }, "Speech transcription failed");
      res.status(502).json({
        error: error instanceof Error ? error.message : "Could not transcribe audio.",
      });
    }
  },
);

export default router;

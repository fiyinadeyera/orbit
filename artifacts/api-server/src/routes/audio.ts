import express, { Router, type IRouter } from "express";
import { detectAudioFormat, speechToText } from "@workspace/integrations-openai-ai-server/audio";
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
      // OpenAI's transcription accepts webm/mp4/ogg/wav/mp3 directly, so send
      // the recording as-is instead of transcoding to WAV with ffmpeg (which
      // isn't installed on the hosted runtime). Unknown magic bytes fall back
      // to webm, the format browsers record by default.
      const detected = detectAudioFormat(req.body);
      const format = detected === "unknown" ? "webm" : detected;
      const text = await speechToText(req.body, format);
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

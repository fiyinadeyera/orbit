---
name: Orbit capture architecture
description: How Orbit's note-capture pipeline is structured (voice-first UI, extract/confirm split) — read before changing capture, extraction, or the New Entry flow.
---

Orbit's capture flow is split into two API steps rather than one:

- `POST /capture/extract` — runs AI extraction (Claude) on a note/transcript only. Persists nothing. Also returns `isExistingPerson` (name-match lookup) so the caller can decide whether to warn about a merge.
- `POST /capture/confirm` — persists the (possibly user-edited) fields the user reviewed. Same person-matching-by-name, `dateMet`-set-once-on-create, and location fallback/never-null-on-update rules as before.

**Why:** the product requirement is voice-first capture (record → transcribe → AI-structure → **user reviews and edits before saving**), which the previous single-shot `/capture` endpoint (extract-and-save-immediately) could not support. Typed entries go through the same two-step pipeline so both paths share one review-before-save step.

**How to apply:** any new capture entry point (e.g. importing notes in bulk, a future API-key integration) should extract first, let the caller inspect/edit, then confirm — don't reintroduce a single-shot save-on-extract endpoint.

Frontend: `artifacts/orbit/src/pages/NewEntry.tsx` is a state machine (idle → recording/typing → processing → review → save). Voice transcription hits a hand-rolled `POST /api/transcribe` route (raw binary body, not orval-generated) that runs `ensureCompatibleFormat` + `speechToText` from `lib/integrations-openai-ai-server/src/audio` (OpenAI `gpt-4o-mini-transcribe` via the Replit AI Integrations proxy — chosen over ElevenLabs because there's no TTS/chat-back, just one-shot batch transcription feeding the same Claude extraction).

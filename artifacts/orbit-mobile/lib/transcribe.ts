// Uploads a recorded audio file to the Orbit API's /transcribe endpoint and
// returns the transcript. The endpoint reads a raw binary body (express.raw),
// so we send the file's bytes directly with BINARY_CONTENT rather than
// wrapping them in multipart form data.
import * as FileSystem from 'expo-file-system/legacy';

// Mirror the base-URL resolution in app/_layout.tsx so voice capture talks to
// the same API server as the generated query hooks.
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export async function transcribeRecording(fileUri: string): Promise<string> {
  const result = await FileSystem.uploadAsync(`${API_BASE}/api/transcribe`, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    // The server detects the real format from the file's magic bytes, so this
    // header is only a hint; we record WAV on device (see JournalScreen).
    headers: { 'Content-Type': 'audio/wav' },
  });

  if (result.status < 200 || result.status >= 300) {
    let message = 'Could not transcribe your recording.';
    try {
      const parsed = JSON.parse(result.body) as { error?: string };
      if (parsed?.error) message = parsed.error;
    } catch {
      // Non-JSON error body; fall back to the generic message.
    }
    throw new Error(message);
  }

  const data = JSON.parse(result.body) as { text?: string };
  const text = (data.text ?? '').trim();
  if (!text) {
    throw new Error("Didn't catch that. Try recording again.");
  }
  return text;
}

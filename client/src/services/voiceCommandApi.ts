import type { VoiceCommand } from "../types/VoiceCommand";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function readResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? "Unable to interpret command");
  return data.command as VoiceCommand;
}

export async function interpretAudioCommand(recording: Blob) {
  return readResponse(await fetch(`${API_URL}/api/voice-commands/audio`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": recording.type || "audio/webm" },
    body: recording,
  }));
}

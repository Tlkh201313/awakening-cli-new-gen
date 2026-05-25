import path from "path"
import fs from "fs/promises"
import { Process } from "@/util/process"
import type { VoiceTranscriptionProvider } from "./voice-settings"

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/** Encode the full recording for cloud upload; local whisper keeps the WAV. */
export async function prepareVoiceUploadFile(wavFile: string, provider: VoiceTranscriptionProvider) {
  if (provider !== "groq") return { file: wavFile, extra: [] as string[] }

  const mp3File = wavFile.replace(/\.wav$/i, ".mp3")
  const result = await Process.run(
    [
      "ffmpeg",
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      wavFile,
      "-ac",
      "1",
      "-ar",
      "16000",
      "-codec:a",
      "libmp3lame",
      "-qscale:a",
      "2",
      mp3File,
    ],
    { nothrow: true },
  )
  if (result.code === 0 && (await fileExists(mp3File))) return { file: mp3File, extra: [mp3File] }
  return { file: wavFile, extra: [] as string[] }
}

export function voiceUploadBasename(file: string) {
  return path.basename(file)
}

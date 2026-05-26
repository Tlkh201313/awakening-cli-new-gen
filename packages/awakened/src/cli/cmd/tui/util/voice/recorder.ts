import { tmpdir } from "os"
import path from "path"
import fs from "fs/promises"
import { Process } from "@/util/process"

export type VoiceRecorder = {
  file: string
  stop: () => Promise<void>
}

const WINDOWS_MIC_SKIP =
  /\b(stereo mix|what u hear|loopback|virtual cable|cable output|speakers?\b|sound mapper - output|primary sound driver output)\b/i
const WINDOWS_MIC_PREFER = /\b(microphone|mic array|headset|webcam|input)\b/i

export function parseWindowsAudioDevices(stderr: string) {
  return [...stderr.matchAll(/"([^"]+)"\s*\(audio\)/g)].map((match) => match[1] ?? "").filter(Boolean)
}

/** Prefer a real microphone over loopback / stereo-mix (common cause of silence → Whisper hallucinations). */
export function pickWindowsAudioDevice(devices: string[]) {
  if (!devices.length) return "Microphone"
  const usable = devices.filter((name) => !WINDOWS_MIC_SKIP.test(name))
  const pool = usable.length ? usable : devices
  const preferred = pool.find((name) => WINDOWS_MIC_PREFER.test(name))
  return preferred ?? pool[0] ?? "Microphone"
}

async function detectWindowsAudioDevice() {
  const result = await Process.run(["ffmpeg", "-list_devices", "true", "-f", "dshow", "-i", "dummy"], { nothrow: true })
  return pickWindowsAudioDevice(parseWindowsAudioDevices(result.stderr?.toString() ?? ""))
}

async function ffmpegInput(selectedDevice?: string) {
  const device = selectedDevice || process.env.AWAKENED_VOICE_DEVICE?.trim()
  if (process.platform === "win32") {
    if (device) return ["-f", "dshow", "-i", `audio=${device}`]
    const defaultDevice = await detectWindowsAudioDevice()
    return ["-f", "dshow", "-i", `audio=${defaultDevice}`]
  }
  if (process.platform === "darwin") {
    return ["-f", "avfoundation", "-i", device || ":0"]
  }
  return ["-f", "pulse", "-i", device || "default"]
}

export async function ffmpegAvailable() {
  const result = await Process.run(["ffmpeg", "-version"], { nothrow: true })
  return result.code === 0
}

export async function startVoiceRecorder(device?: string) {
  const file = path.join(tmpdir(), `awakened-voice-${Date.now()}.wav`)
  const inputArgs = await ffmpegInput(device)
  const args = [
    "ffmpeg",
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    ...inputArgs,
    "-ac",
    "1",
    "-ar",
    "16000",
    "-af",
    "highpass=f=80,lowpass=f=8000,dynaudnorm=f=150:g=15",
    file,
  ]
  const proc = Process.spawn(args, { stdout: "ignore", stderr: "pipe", stdin: "pipe" })
  const cleanup = () => {
    try {
      proc.kill("SIGTERM")
    } catch {}
  }
  process.on("exit", cleanup)
  await new Promise((resolve) => setTimeout(resolve, 300))
  if (proc.exitCode !== null) {
    const stderr = proc.stderr ? await readStream(proc.stderr) : ""
    throw new Error(stderr.trim() || "ffmpeg failed to start — check microphone permissions and AWAKENED_VOICE_DEVICE")
  }
  return {
    file,
    stop: async () => {
      process.removeListener("exit", cleanup)
      if (proc.exitCode === null) {
        proc.stdin?.write("q\n")
        proc.stdin?.end()
      }
      await proc.exited.catch(() => 0)
      await new Promise((resolve) => setTimeout(resolve, 650))
    },
  } satisfies VoiceRecorder
}

export async function recordingDurationSec(file: string) {
  const result = await Process.run(
    [
      "ffprobe",
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      file,
    ],
    { nothrow: true },
  )
  const value = Number.parseFloat(result.stdout?.toString().trim() ?? "")
  return Number.isFinite(value) ? value : 0
}

export async function assertRecordingFile(file: string) {
  const stat = await fs.stat(file).catch(() => undefined)
  const bytes = stat?.size ?? 0
  const duration = await recordingDurationSec(file)
  if (bytes < 1500 || duration < 0.28) {
    throw new Error(
      `Recording too short (${duration.toFixed(2)}s) — hold ${process.platform === "win32" ? "Ctrl+Alt+V" : "the voice hotkey"} while speaking, then release.`,
    )
  }
}

async function readStream(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString("utf8")
}

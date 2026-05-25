import path from "path"
import fs from "fs/promises"
import os from "os"
import { BlobReader, Uint8ArrayWriter, ZipReader } from "@zip.js/zip.js"
import { Process } from "@/util/process"
import { sanitizeVoiceTranscript, textFromVoiceSegments } from "./transcript-sanitize"

const WHISPER_CPP_VERSION = "v1.8.4"

/** Same GGML models Handy documents at https://github.com/cjpais/Handy */
export const VOICE_MODELS = {
  tiny: {
    file: "ggml-tiny.en.bin",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
    label: "Tiny (fast, English)",
  },
  small: {
    file: "ggml-small.bin",
    url: "https://blob.handy.computer/ggml-small.bin",
    label: "Small (Handy default)",
  },
  medium: {
    file: "whisper-medium-q4_1.bin",
    url: "https://blob.handy.computer/whisper-medium-q4_1.bin",
    label: "Medium",
  },
  turbo: {
    file: "ggml-large-v3-turbo.bin",
    url: "https://blob.handy.computer/ggml-large-v3-turbo.bin",
    label: "Turbo",
  },
  large: {
    file: "ggml-large-v3-q5_0.bin",
    url: "https://blob.handy.computer/ggml-large-v3-q5_0.bin",
    label: "Large",
  },
} as const

export type VoiceModelId = keyof typeof VOICE_MODELS

export function voiceModelFromEnv() {
  const raw = process.env.AWAKENED_VOICE_MODEL?.trim().toLowerCase()
  if (raw && raw in VOICE_MODELS) return raw as VoiceModelId
  return "small" satisfies VoiceModelId
}

export function voiceDataDir() {
  if (process.platform === "win32") {
    const base = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local")
    return path.join(base, "awakened", "whisper-cpp")
  }
  const base = process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share")
  return path.join(base, "awakened", "whisper-cpp")
}

function legacyVoiceDataDir() {
  return path.join(os.homedir(), ".local", "share", "awakened", "whisper-cpp")
}

export async function resolveVoiceDataDir() {
  const primary = voiceDataDir()
  if (process.platform === "win32" && primary !== legacyVoiceDataDir()) {
    if (!(await fileExists(primary)) && (await fileExists(legacyVoiceDataDir()))) return legacyVoiceDataDir()
  }
  return primary
}

function whispercppBinaryName() {
  if (process.platform === "win32") return "whisper-cli.exe"
  return "whisper-cli"
}

function whispercppAssetName() {
  if (process.platform === "win32") return "whisper-bin-Win32.zip"
  if (process.platform === "darwin") return "whisper-bin-macos-arm64.zip"
  return "whisper-bin-ubuntu-x64.zip"
}

function whispercppDownloadUrl() {
  return `https://github.com/ggml-org/whisper.cpp/releases/download/${WHISPER_CPP_VERSION}/${whispercppAssetName()}`
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function downloadFile(url: string, dest: string, onProgress?: (message: string) => void) {
  onProgress?.(`Downloading ${path.basename(dest)}…`)
  const response = await fetch(url, { redirect: "follow" })
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`)
  const buffer = await response.arrayBuffer()
  await Bun.write(dest, buffer)
}

async function extractZip(zipPath: string, outDir: string) {
  const zipFile = Bun.file(zipPath)
  const arrayBuffer = await zipFile.arrayBuffer()
  const reader = new ZipReader(new BlobReader(new Blob([arrayBuffer])))
  const entries = await reader.getEntries()
  for (const entry of entries) {
    if (entry.directory) continue
    const dest = path.join(outDir, entry.filename)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    const data = await entry.getData!(new Uint8ArrayWriter())
    await Bun.write(dest, data)
  }
  await reader.close()
}

async function findBinaryInDir(dir: string, name: string) {
  async function walk(current: string): Promise<string | undefined> {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isFile() && entry.name === name) return full
      if (entry.isDirectory()) {
        const found = await walk(full)
        if (found) return found
      }
    }
  }
  return walk(dir)
}

export type WhisperLocalPaths = {
  dir: string
  binary: string
  model: string
  modelId: VoiceModelId
}

async function resolveInstalledModel(dir: string) {
  const preferredId = voiceModelFromEnv()
  const preferredPath = path.join(dir, VOICE_MODELS[preferredId].file)
  if (await fileExists(preferredPath)) return { modelId: preferredId, modelPath: preferredPath }

  for (const id of Object.keys(VOICE_MODELS) as VoiceModelId[]) {
    const candidate = path.join(dir, VOICE_MODELS[id].file)
    if (await fileExists(candidate)) return { modelId: id, modelPath: candidate }
  }

  return { modelId: preferredId, modelPath: preferredPath }
}

function whisperLanguageForModel(modelPath: string) {
  const base = path.basename(modelPath).toLowerCase()
  if (base.includes(".en.") || base.endsWith(".en.bin")) return "en"
  return "auto"
}

export async function ensureWhisperLocal(options?: { onProgress?: (message: string) => void }) {
  const onProgress = options?.onProgress
  const dir = await resolveVoiceDataDir()
  const binName = whispercppBinaryName()
  const installed = await resolveInstalledModel(dir)
  const modelId = installed.modelId
  const modelPath = installed.modelPath

  const existingBin =
    (await fileExists(path.join(dir, "Release", binName)) ? path.join(dir, "Release", binName) : undefined) ||
    (await findBinaryInDir(dir, binName).catch(() => undefined))

  if (existingBin && (await fileExists(modelPath))) {
    return { dir, binary: existingBin, model: modelPath, modelId } satisfies WhisperLocalPaths
  }

  await fs.mkdir(dir, { recursive: true })
  onProgress?.("Setting up offline speech recognition (whisper.cpp)…")

  let binary = existingBin
  if (!binary) {
    const zipPath = path.join(dir, "whisper-bin.zip")
    await downloadFile(whispercppDownloadUrl(), zipPath, onProgress)
    await extractZip(zipPath, dir)
    await fs.unlink(zipPath).catch(() => {})
    if (process.platform !== "win32") {
      const found = await findBinaryInDir(dir, binName)
      if (found) await fs.chmod(found, 0o755)
    }
    binary =
      (await fileExists(path.join(dir, "Release", binName)) ? path.join(dir, "Release", binName) : undefined) ||
      (await findBinaryInDir(dir, binName))
  }

  if (!binary) throw new Error(`Could not find ${binName} after installing whisper.cpp into ${dir}`)

  if (!(await fileExists(modelPath))) {
    await downloadFile(VOICE_MODELS[modelId].url, modelPath, onProgress)
  }

  return { dir, binary, model: modelPath, modelId } satisfies WhisperLocalPaths
}

async function readTranscriptFile(filePath: string) {
  if (!(await fileExists(filePath))) return undefined
  const txt = (await Bun.file(filePath).text()).trim()
  await fs.unlink(filePath).catch(() => {})
  return txt || undefined
}

type WhisperJsonSegment = {
  text?: string
  no_speech_prob?: number
  avg_logprob?: number
  compression_ratio?: number
}

async function readWhisperJsonTranscript(jsonPath: string) {
  if (!(await fileExists(jsonPath))) return undefined
  const payload = (await Bun.file(jsonPath).json()) as { segments?: WhisperJsonSegment[]; text?: string }
  await fs.unlink(jsonPath).catch(() => {})
  if (payload.segments?.length) {
    const fromSegments = textFromVoiceSegments(payload.segments)
    if (fromSegments) return fromSegments
  }
  const fallback = sanitizeVoiceTranscript(payload.text?.trim() ?? "")
  return fallback || undefined
}

/** Flags tuned for short mic clips — reduces silence hallucinations like "I don't know." */
function whisperDecodeArgs(language: string, outputBase: string) {
  return [
    "-otxt",
    "-oj",
    "-nt",
    "-nf",
    "-sns",
    "-nc",
    "-l",
    language,
    "-bo",
    "1",
    "-bs",
    "1",
    "-nth",
    "0.55",
    "-et",
    "2.4",
    "-lpt",
    "-0.85",
    "-of",
    outputBase,
  ]
}

export async function transcribeWithWhisperLocal(file: string, options?: { onProgress?: (message: string) => void }) {
  const { binary, model, modelId } = await ensureWhisperLocal(options)
  const language = whisperLanguageForModel(model)
  const outputBase = path.join(path.dirname(file), path.basename(file, path.extname(file)))
  const transcriptPaths = [`${outputBase}.txt`, `${file}.txt`, path.join(path.dirname(binary), `${path.basename(file)}.txt`)]

  const result = await Process.run(
    [binary, "-m", model, "-f", file, ...whisperDecodeArgs(language, outputBase)],
    { nothrow: true, cwd: path.dirname(binary) },
  )

  const fromJson = await readWhisperJsonTranscript(`${outputBase}.json`)
  if (fromJson) return fromJson

  for (const transcriptPath of transcriptPaths) {
    const txt = await readTranscriptFile(transcriptPath)
    if (txt) {
      const clean = sanitizeVoiceTranscript(txt)
      if (clean) return clean
    }
  }

  const stdout = result.stdout?.toString().trim()
  if (stdout) {
    const clean = sanitizeVoiceTranscript(stdout.replace(/\x1b\[[0-9;]*m/g, "").trim())
    if (clean) return clean
  }

  const stderr = result.stderr?.toString().trim()
  if (result.code !== 0) {
    throw new Error(stderr || `whisper-cli exited with code ${result.code}`)
  }

  throw new Error(
    stderr
      ? `whisper-cli produced no text (model: ${modelId}). ${stderr.slice(0, 400)}`
      : `whisper-cli produced no text (model: ${modelId}).`,
  )
}

export function voiceInstallHint() {
  return "Run: bun run --cwd packages/awakened install-voice"
}

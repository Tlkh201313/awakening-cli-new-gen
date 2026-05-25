import path from "path"
import fs from "fs/promises"
import os from "os"
import { Process } from "@/util/process"

const BRIDGE_HOST = "127.0.0.1"
const BRIDGE_WAIT_MS = 120_000
const BRIDGE_POLL_MS = 500

export type OpenWhisprBridge = {
  version: number
  port: number
  token: string
}

export type OpenWhisprTranscription = {
  id: number
  text: string
  timestamp?: string
  status?: string
}

export function awakenedPackageRoot() {
  return path.join(import.meta.dir, "../../../../../../")
}

/** Git clone + Awakened patches (editable upstream). */
export function openwhisprRepoDir() {
  return path.join(awakenedPackageRoot(), "vendor/openwhispr")
}

export function openwhisprVendorManifestPath() {
  return path.join(openwhisprRepoDir(), ".awakened-manifest.json")
}

export function openwhisprBridgeFile() {
  return path.join(os.homedir(), ".openwhispr", "cli-bridge.json")
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function readOpenWhisprVendorManifest() {
  if (!(await fileExists(openwhisprVendorManifestPath()))) return undefined
  return (await Bun.file(openwhisprVendorManifestPath()).json()) as {
    commit?: string
    ref?: string
    repoDir?: string
    launch?: { command: string; args: string[] }
  }
}

export async function readOpenWhisprBridge() {
  if (!(await fileExists(openwhisprBridgeFile()))) return undefined
  const raw = (await Bun.file(openwhisprBridgeFile()).json()) as OpenWhisprBridge
  if (!raw?.port || !raw?.token) return undefined
  return raw
}

export async function bridgeFetch<T>(bridgePath: string, init?: RequestInit) {
  const bridge = await readOpenWhisprBridge()
  if (!bridge) throw new Error("OpenWhispr is not running (CLI bridge offline).")
  const url = `http://${BRIDGE_HOST}:${bridge.port}${bridgePath}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      ...(init?.headers ?? {}),
    },
  })
  const body = (await response.json().catch(() => ({}))) as { data?: T; error?: { message?: string } }
  if (!response.ok) {
    throw new Error(body.error?.message || `OpenWhispr bridge ${response.status} on ${bridgePath}`)
  }
  return body
}

export async function bridgeHealthy() {
  const bridge = await readOpenWhisprBridge()
  if (!bridge) return false
  try {
    await bridgeFetch<{ ok?: boolean }>("/v1/health")
    return true
  } catch {
    return false
  }
}

export async function openwhisprSourceReady() {
  return fileExists(path.join(openwhisprRepoDir(), "package.json"))
}

export async function resolveOpenWhisprLaunch() {
  const manifest = await readOpenWhisprVendorManifest()
  if (manifest?.launch?.command && manifest.launch.args?.length) {
    return { cwd: manifest.repoDir ?? openwhisprRepoDir(), cmd: [manifest.launch.command, ...manifest.launch.args] }
  }
  const npm = process.platform === "win32" ? "npm.cmd" : "npm"
  return { cwd: openwhisprRepoDir(), cmd: [npm, "start"] }
}

async function launchOpenWhisprFromSource() {
  const launch = await resolveOpenWhisprLaunch()
  if (!(await fileExists(path.join(launch.cwd, "package.json")))) {
    throw new Error(`OpenWhispr source missing at ${launch.cwd}. Run: bun run --cwd packages/awakened install-openwhispr`)
  }
  Process.spawn(launch.cmd, {
    cwd: launch.cwd,
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    env: {
      ...process.env,
      AWAKENED_VOICE_BRIDGE: "1",
      OPENWHISPR_AWAKENED_MODE: "1",
    },
  })
}

async function waitForBridge(options?: { onProgress?: (message: string) => void }) {
  const deadline = Date.now() + BRIDGE_WAIT_MS
  while (Date.now() < deadline) {
    if (await bridgeHealthy()) return await readOpenWhisprBridge()
    options?.onProgress?.("Building OpenWhispr / waiting for bridge…")
    await new Promise((resolve) => setTimeout(resolve, BRIDGE_POLL_MS))
  }
  throw new Error("OpenWhispr did not start. Run: bun run --cwd packages/awakened install-openwhispr")
}

export async function ensureOpenWhisprRunning(options?: { onProgress?: (message: string) => void }) {
  if (await bridgeHealthy()) return await readOpenWhisprBridge()

  if (!(await openwhisprSourceReady())) {
    throw new Error(openwhisprInstallHint())
  }

  options?.onProgress?.("Starting OpenWhispr (Awakened build)…")
  await launchOpenWhisprFromSource()
  return await waitForBridge(options)
}

export async function listRecentTranscriptions(limit = 20) {
  const result = await bridgeFetch<OpenWhisprTranscription[]>(`/v1/transcriptions/list?limit=${limit}`)
  const rows = Array.isArray(result.data) ? result.data : []
  return rows
    .map((row) => ({
      id: Number(row.id),
      text: typeof row.text === "string" ? row.text : "",
      timestamp: typeof row.timestamp === "string" ? row.timestamp : undefined,
      status: typeof row.status === "string" ? row.status : undefined,
    }))
    .filter((row) => Number.isFinite(row.id) && row.id > 0)
}

export function openwhisprInstallHint() {
  return "Run: bun run --cwd packages/awakened install-openwhispr (git clone + patch + npm install)"
}

export function awakenedVoiceSessionFile() {
  return path.join(openwhisprRepoDir(), ".awakened-voice-session.json")
}

export async function writeAwakenedVoiceSession(active: boolean) {
  const dir = openwhisprRepoDir()
  await fs.mkdir(dir, { recursive: true })
  const file = awakenedVoiceSessionFile()
  if (!active) {
    await fs.unlink(file).catch(() => {})
    return
  }
  await Bun.write(
    file,
    JSON.stringify({
      active: true,
      client: "awakened-cli",
      startedAt: new Date().toISOString(),
    }),
  )
}

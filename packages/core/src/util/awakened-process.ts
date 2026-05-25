export const AWAKENED_RUN_ID = "AWAKENED_RUN_ID"
export const AWAKENED_PROCESS_ROLE = "AWAKENED_PROCESS_ROLE"
export const AWAKENED_START_DIRECTORY = "AWAKENED_START_DIRECTORY"

export function ensureRunID() {
  return (process.env[AWAKENED_RUN_ID] ??= crypto.randomUUID())
}

export function ensureProcessRole(fallback: "main" | "worker") {
  return (process.env[AWAKENED_PROCESS_ROLE] ??= fallback)
}

export function ensureProcessMetadata(fallback: "main" | "worker") {
  return {
    runID: ensureRunID(),
    processRole: ensureProcessRole(fallback),
  }
}

export function sanitizedProcessEnv(overrides?: Record<string, string>) {
  const env = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  )
  return overrides ? Object.assign(env, overrides) : env
}

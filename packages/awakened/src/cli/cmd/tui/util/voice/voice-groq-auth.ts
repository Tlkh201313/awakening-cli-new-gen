import path from "path"
import { Global } from "@awakened-ai/core/global"
import { resolveGroqApiKey } from "./transcribe-groq"

const GROQ_PROVIDER_ID = "groq"

export async function readGroqApiKeyFromAuthStore() {
  const file = path.join(Global.Path.data, "auth.json")
  const data = (await Bun.file(file).json().catch(() => ({}))) as Record<string, { type?: string; key?: string }>
  const entry = data[GROQ_PROVIDER_ID]
  if (entry?.type === "api" && typeof entry.key === "string") return entry.key.trim()
  return ""
}

export async function resolveGroqApiKeyAll(kvKey?: string) {
  return resolveGroqApiKey(kvKey) || (await readGroqApiKeyFromAuthStore())
}

export async function testGroqConnection(apiKey: string) {
  const key = apiKey.trim()
  if (!key) throw new Error("Groq API key is empty")

  const response = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(body.trim() || `Groq API check failed (${response.status})`)
  }
}

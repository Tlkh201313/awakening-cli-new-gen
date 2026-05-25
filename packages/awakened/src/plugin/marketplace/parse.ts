import { homedir } from "os"
import path from "path"
import { Filesystem } from "@/util/filesystem"
import type { MarketplaceSource } from "./types"

export async function parseMarketplaceInput(
  input: string,
): Promise<MarketplaceSource | { error: string } | null> {
  const trimmed = input.trim()

  const ssh = trimmed.match(/^([a-zA-Z0-9._-]+@[^:]+:.+?(?:\.git)?)(#(.+))?$/)
  if (ssh?.[1]) {
    const url = ssh[1]
    const ref = ssh[3]
    return ref ? { source: "git", url, ref } : { source: "git", url }
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const fragment = trimmed.match(/^([^#]+)(#(.+))?$/)
    const url = fragment?.[1] ?? trimmed
    const ref = fragment?.[3]
    if (url.endsWith(".git") || url.includes("/_git/")) {
      return ref ? { source: "git", url, ref } : { source: "git", url }
    }

    try {
      const parsed = new URL(url)
      if (parsed.hostname === "github.com" || parsed.hostname === "www.github.com") {
        const match = parsed.pathname.match(/^\/([^/]+\/[^/]+?)(\/|\.git|$)/)
        if (match?.[1]) {
          const gitUrl = url.endsWith(".git") ? url : `${url}.git`
          return ref ? { source: "git", url: gitUrl, ref } : { source: "git", url: gitUrl }
        }
      }
    } catch {}

    if (url.endsWith(".json")) return { source: "url", url }
    return { source: "url", url }
  }

  const isWindows = process.platform === "win32"
  const isWindowsPath =
    isWindows &&
    (trimmed.startsWith(".\\") || trimmed.startsWith("..\\") || /^[a-zA-Z]:[/\\]/.test(trimmed))
  if (trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.startsWith("/") || trimmed.startsWith("~") || isWindowsPath) {
    const resolved = path.resolve(trimmed.startsWith("~") ? trimmed.replace(/^~/, homedir()) : trimmed)
    const stat = await Filesystem.statAsync(resolved)
    if (!stat) return { error: `Path does not exist: ${resolved}` }
    if (stat.isFile()) {
      if (!resolved.endsWith(".json")) {
        return { error: `File path must point to marketplace.json, got: ${resolved}` }
      }
      return { source: "file", path: resolved }
    }
    if (stat.isDirectory()) return { source: "directory", path: resolved }
    return { error: `Path is neither a file nor a directory: ${resolved}` }
  }

  if (trimmed.includes("/") && !trimmed.startsWith("@") && !trimmed.includes(":")) {
    const fragment = trimmed.match(/^([^#@]+)(?:[#@](.+))?$/)
    const repo = fragment?.[1] ?? trimmed
    const ref = fragment?.[2]
    return ref ? { source: "github", repo, ref } : { source: "github", repo }
  }

  return null
}

export function parsePluginIdentifier(input: string) {
  const at = input.lastIndexOf("@")
  if (at <= 0) return { name: input.trim(), marketplace: undefined as string | undefined }
  return {
    name: input.slice(0, at).trim(),
    marketplace: input.slice(at + 1).trim() || undefined,
  }
}

export function marketplaceSourceKey(source: MarketplaceSource) {
  if (source.source === "github") return `github:${source.repo}${source.ref ? `@${source.ref}` : ""}`
  if (source.source === "git") return `git:${source.url}${source.ref ? `@${source.ref}` : ""}`
  if (source.source === "url") return `url:${source.url}`
  if (source.source === "file") return `file:${source.path}`
  return `dir:${source.path}`
}

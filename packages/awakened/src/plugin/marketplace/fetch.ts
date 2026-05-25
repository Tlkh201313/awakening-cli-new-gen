import path from "path"
import { cp, mkdir } from "fs/promises"
import { Filesystem } from "@/util/filesystem"
import { Process } from "@/util/process"
import { errorMessage } from "@/util/error"
import { withTimeout } from "@/util/timeout"
import type { LoadedMarketplace, MarketplaceSource, PluginMarketplace, PluginMarketplaceEntry } from "./types"
import { cacheDirForMarketplace, getMarketplaceRecord, setMarketplaceInstallLocation } from "./store"
import { marketplaceSourceKey } from "./parse"
import {
  fetchGithubRaw,
  githubGitUrl,
  githubRefCandidates,
  MARKETPLACE_FETCH_TIMEOUT_MS,
  MARKETPLACE_GIT_CLONE_TIMEOUT_MS,
  MARKETPLACE_GIT_PULL_TIMEOUT_MS,
  MARKETPLACE_LOAD_TIMEOUT_MS,
  marketplaceNetworkHint,
} from "./github"

const MANIFEST_PATHS = [".claude-plugin/marketplace.json", ".awakened-plugin/marketplace.json", "marketplace.json"]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseMarketplaceJson(data: unknown): PluginMarketplace | undefined {
  if (!isRecord(data)) return
  if (typeof data.name !== "string" || !data.name.trim()) return
  if (!Array.isArray(data.plugins)) return

  const plugins = data.plugins.flatMap((item): PluginMarketplaceEntry[] => {
    if (!isRecord(item)) return []
    if (typeof item.name !== "string" || !item.name.trim()) return []
    if (item.source === undefined) return []
    return [
      {
        name: item.name.trim(),
        description: typeof item.description === "string" ? item.description : undefined,
        category: typeof item.category === "string" ? item.category : undefined,
        tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === "string") : undefined,
        source: item.source as PluginMarketplaceEntry["source"],
      },
    ]
  })

  return {
    name: data.name.trim(),
    description: typeof data.description === "string" ? data.description : undefined,
    owner: isRecord(data.owner) && typeof data.owner.name === "string" ? { name: data.owner.name } : undefined,
    plugins,
  }
}

export async function loadMarketplace(name: string, refresh = false): Promise<LoadedMarketplace | { error: string }> {
  const record = await getMarketplaceRecord(name)
  if (!record) return { error: `Marketplace "${name}" is not configured. Run: awakened plugin marketplace add <source>` }

  const cache = cacheDirForMarketplace(name, record.source)
  if (refresh || !(await Filesystem.exists(path.join(cache, ".marketplace-loaded")))) {
    const materialized = await materializeMarketplace(name, record.source, cache)
    if ("error" in materialized) return { error: materialized.error ?? "Failed to load marketplace" }
    await setMarketplaceInstallLocation(name, materialized.root)
  }

  const root = (await getMarketplaceRecord(name))?.installLocation ?? cache
  const manifest = await readManifest(root, record.source)
  if ("error" in manifest) return { error: manifest.error ?? "Invalid marketplace manifest" }

  return {
    name,
    marketplace: manifest.marketplace,
    root: manifest.root,
    source: record.source,
  }
}

export async function loadAllMarketplaces(refresh = false) {
  const { listMarketplaceNames } = await import("./store")
  const names = await listMarketplaceNames()
  const loaded: LoadedMarketplace[] = []
  const errors: Array<{ name: string; error: string }> = []

  const results = await Promise.all(
    names.map(async (name) => {
      try {
        return await withTimeout(
          loadMarketplace(name, refresh),
          MARKETPLACE_LOAD_TIMEOUT_MS,
          `Marketplace "${name}" timed out`,
        )
      } catch (error) {
        return { error: errorMessage(error) }
      }
    }),
  )

  for (const [index, result] of results.entries()) {
    const name = names[index]!
    if ("error" in result) {
      errors.push({ name, error: result.error ?? "Failed to load marketplace" })
      continue
    }
    loaded.push(result)
  }

  return { loaded, errors }
}

async function readManifest(root: string, source: MarketplaceSource) {
  if (source.source === "file") {
    const marketplace = parseMarketplaceJson(await Filesystem.readJson(source.path))
    if (!marketplace) return { error: `Invalid marketplace manifest: ${source.path}` }
    return { marketplace, root: path.dirname(source.path) }
  }

  if (source.source === "url") {
    const response = await fetch(source.url)
    if (!response.ok) return { error: `Failed to fetch marketplace (${response.status}): ${source.url}` }
    const marketplace = parseMarketplaceJson(await response.json())
    if (!marketplace) return { error: `Invalid marketplace manifest: ${source.url}` }
    return { marketplace, root }
  }

  if (source.source === "directory") {
    return readManifest(source.path, source)
  }

  for (const rel of manifestCandidates(source)) {
    const file = path.join(root, rel)
    if (!(await Filesystem.exists(file))) continue
    const marketplace = parseMarketplaceJson(await Filesystem.readJson(file))
    if (!marketplace) continue
    return { marketplace, root: path.dirname(file) === root ? root : path.dirname(path.dirname(file)) }
  }

  return { error: `Marketplace manifest not found under ${root}` }
}

function manifestCandidates(source: MarketplaceSource) {
  if (source.source === "github" && source.path) return [source.path]
  if (source.source === "git" && source.path) return [source.path]
  return MANIFEST_PATHS
}

async function materializeMarketplace(name: string, source: MarketplaceSource, cache: string) {
  await mkdir(path.dirname(cache), { recursive: true })

  if (source.source === "file") {
    return { root: path.dirname(source.path) }
  }

  if (source.source === "directory") {
    return { root: source.path }
  }

  if (source.source === "url") {
    await mkdir(cache, { recursive: true })
    const response = await fetch(source.url, { signal: AbortSignal.timeout(MARKETPLACE_FETCH_TIMEOUT_MS) })
    if (!response.ok) return { error: `Failed to fetch marketplace (${response.status}): ${source.url}` }
    const text = await response.text()
    await Filesystem.write(path.join(cache, "marketplace.json"), text)
    await Filesystem.write(path.join(cache, ".marketplace-loaded"), new Date().toISOString())
    return { root: cache }
  }

  if (source.source === "github") {
    const http = await fetchGithubMarketplace(source, cache)
    if (!("error" in http)) return http

    const url = githubGitUrl(source.repo)
    const cloned = await cloneMarketplaceRepo(
      name,
      { source: "git", url, ref: source.ref, path: source.path },
      cache,
      source.repo,
    )
    if (!("error" in cloned)) return cloned

    return { error: marketplaceNetworkHint(cloned.error ?? http.error ?? `Failed to load marketplace ${name}`) }
  }

  if (source.source === "git") {
    return cloneMarketplaceRepo(name, source, cache)
  }

  return { error: `Unsupported marketplace source: ${JSON.stringify(source)}` }
}

async function fetchGithubMarketplace(source: Extract<MarketplaceSource, { source: "github" }>, cache: string) {
  const paths = manifestCandidates(source)
  const attempts = githubRefCandidates(source.ref).flatMap((ref) => paths.map((rel) => ({ ref, rel })))

  const hits = await Promise.all(
    attempts.map(async ({ ref, rel }) => {
      const text = await fetchGithubRaw(source.repo, ref, rel)
      if (!text) return

      let data: unknown
      try {
        data = JSON.parse(text)
      } catch {
        return
      }

      const marketplace = parseMarketplaceJson(data)
      if (!marketplace) return

      return { ref, rel, text, marketplace }
    }),
  )

  const hit = hits.find(Boolean)
  if (!hit) return { error: `Could not fetch marketplace manifest for ${source.repo} over HTTPS` }

  await mkdir(cache, { recursive: true })
  const dest = path.join(cache, hit.rel)
  await mkdir(path.dirname(dest), { recursive: true })
  await Filesystem.write(dest, hit.text)
  await Filesystem.write(path.join(cache, ".marketplace-loaded"), new Date().toISOString())
  await Filesystem.write(path.join(cache, ".marketplace-http-only"), hit.ref)
  return { root: cache }
}

async function cloneMarketplaceRepo(
  name: string,
  source: Extract<MarketplaceSource, { source: "git" }>,
  cache: string,
  githubRepo?: string,
) {
  if (await Filesystem.exists(path.join(cache, ".git"))) {
    const pull = await Process.run(["git", "-C", cache, "pull", "--ff-only"], {
      nothrow: true,
      abort: AbortSignal.timeout(MARKETPLACE_GIT_PULL_TIMEOUT_MS),
    })
    if (pull.code === 0) {
      await Filesystem.write(path.join(cache, ".marketplace-loaded"), new Date().toISOString())
      return { root: cache }
    }
  }

  if (await Filesystem.exists(cache)) {
    await cp(cache, `${cache}.bak-${Date.now()}`, { recursive: true, force: true }).catch(() => {})
  }

  await mkdir(path.dirname(cache), { recursive: true })
  const cloneArgs = ["git", "clone", "--depth", "1"]
  if (source.ref) cloneArgs.push("--branch", source.ref)
  cloneArgs.push(source.url, cache)

  const result = await Process.run(cloneArgs, {
    nothrow: true,
    abort: AbortSignal.timeout(MARKETPLACE_GIT_CLONE_TIMEOUT_MS),
  })
  if (result.code !== 0) {
    const detail = result.stderr.toString().trim() || result.stdout.toString().trim()
    const message = `Failed to clone marketplace ${name}: ${detail || marketplaceSourceKey(source)}`
    if (githubRepo) return { error: message }
    if (/could not connect|unable to access|connection refused|timed out/i.test(detail)) {
      return { error: marketplaceNetworkHint(message) }
    }
    return { error: message }
  }

  await Filesystem.write(path.join(cache, ".marketplace-loaded"), new Date().toISOString())
  return { root: cache }
}

export async function updateMarketplace(name?: string) {
  if (name) {
    const result = await loadMarketplace(name, true)
    if ("error" in result) return [{ name, ok: false as const, message: result.error }]
    return [{ name, ok: true as const, message: `Updated ${name}` }]
  }

  const { listMarketplaceNames } = await import("./store")
  const names = await listMarketplaceNames()
  const out: Array<{ name: string; ok: boolean; message: string }> = []
  for (const item of names) {
    const result = await loadMarketplace(item, true)
    if ("error" in result) out.push({ name: item, ok: false, message: result.error })
    else out.push({ name: item, ok: true, message: `Updated ${item}` })
  }
  return out
}

export async function findMarketplacePlugin(name: string, marketplace?: string) {
  const { loaded, errors } = await loadAllMarketplaces()
  if (errors.length && !loaded.length) {
    return { error: errors.map((item) => `${item.name}: ${item.error}`).join("\n") }
  }

  const matches = loaded.flatMap((item) => {
    if (marketplace && item.name !== marketplace && item.marketplace.name !== marketplace) return []
    const entry = item.marketplace.plugins.find((plugin) => plugin.name === name)
    if (!entry) return []
    return [{ marketplace: item, entry }]
  })

  if (!matches.length) {
    if (marketplace) return { error: `Plugin "${name}" not found in marketplace "${marketplace}"` }
    return { error: `Plugin "${name}" not found in configured marketplaces` }
  }

  if (!marketplace && matches.length > 1) {
    return {
      error: `Plugin "${name}" exists in multiple marketplaces: ${matches.map((item) => item.marketplace.name).join(", ")}. Use name@marketplace`,
    }
  }

  return { match: matches[0]! }
}

import path from "path"
import { mkdir } from "fs/promises"
import { OFFICIAL_MARKETPLACES } from "./official"
import type { KnownMarketplacesFile, MarketplaceSource } from "./types"
import { knownMarketplacesFile, marketplacesCacheDir, pluginsRoot } from "./paths"
import { Filesystem } from "@/util/filesystem"
import { marketplaceSourceKey } from "./parse"

export async function readKnownMarketplaces(): Promise<KnownMarketplacesFile> {
  const file = knownMarketplacesFile()
  if (!(await Filesystem.exists(file))) return {}
  const data = await Filesystem.readJson<KnownMarketplacesFile>(file).catch(() => ({} as KnownMarketplacesFile))
  return data && typeof data === "object" && !Array.isArray(data) ? data : {}
}

export async function writeKnownMarketplaces(data: KnownMarketplacesFile) {
  await mkdir(pluginsRoot(), { recursive: true })
  await Filesystem.write(knownMarketplacesFile(), `${JSON.stringify(data, null, 2)}\n`)
}

export async function ensureDefaultMarketplaces() {
  const current = await readKnownMarketplaces()
  if (Object.keys(current).length > 0) return current

  const next: KnownMarketplacesFile = {}
  for (const item of OFFICIAL_MARKETPLACES) {
    next[item.name] = {
      source: item.source,
      autoUpdate: item.autoUpdate ?? true,
    }
  }
  await writeKnownMarketplaces(next)
  return next
}

export async function addMarketplace(name: string, source: MarketplaceSource) {
  const current = await readKnownMarketplaces()
  if (current[name]) {
    return { ok: false as const, message: `Marketplace "${name}" is already configured` }
  }

  current[name] = { source, autoUpdate: true }
  await writeKnownMarketplaces(current)
  return { ok: true as const, name }
}

export async function removeMarketplace(name: string) {
  const current = await readKnownMarketplaces()
  if (!current[name]) {
    return { ok: false as const, message: `Marketplace "${name}" is not configured` }
  }

  delete current[name]
  await writeKnownMarketplaces(current)
  return { ok: true as const, name }
}

export async function listMarketplaceNames() {
  await ensureDefaultMarketplaces()
  return Object.keys(await readKnownMarketplaces()).sort()
}

export async function getMarketplaceRecord(name: string) {
  await ensureDefaultMarketplaces()
  return (await readKnownMarketplaces())[name]
}

export function cacheDirForMarketplace(name: string, source: MarketplaceSource) {
  return path.join(marketplacesCacheDir(), `${name}-${hash(marketplaceSourceKey(source))}`)
}

export async function setMarketplaceInstallLocation(name: string, location: string) {
  const current = await readKnownMarketplaces()
  const entry = current[name]
  if (!entry) return
  entry.installLocation = location
  await writeKnownMarketplaces(current)
}

export async function marketplaceInstallLocation(name: string) {
  const entry = await getMarketplaceRecord(name)
  return entry?.installLocation
}

function hash(input: string) {
  let value = 0
  for (let i = 0; i < input.length; i++) {
    value = (value * 31 + input.charCodeAt(i)) >>> 0
  }
  return value.toString(16)
}

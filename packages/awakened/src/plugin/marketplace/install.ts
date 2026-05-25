import path from "path"
import { cp, mkdir } from "fs/promises"
import { pathToFileURL } from "url"
import { Filesystem } from "@/util/filesystem"
import { Process } from "@/util/process"
import { installPlugin, patchPluginConfig, readPluginManifest } from "../install"
import { isPathPluginSpec, resolvePathPluginTarget } from "../shared"
import type { MarketplaceInstallResult, PluginEntrySource } from "./types"
import { findMarketplacePlugin } from "./fetch"
import {
  githubGitUrl,
  MARKETPLACE_GIT_CLONE_TIMEOUT_MS,
  marketplaceNetworkHint,
  rewriteGithubCloneUrl,
} from "./github"
import { localMarketplacePluginDir, pluginSourceCacheDir } from "./paths"
import { parsePluginIdentifier } from "./parse"

export type InstallCtx = {
  global?: boolean
  force?: boolean
  vcs?: string
  worktree: string
  directory: string
  config: string
}

export async function installFromMarketplace(input: string, ctx: InstallCtx): Promise<MarketplaceInstallResult> {
  const { name, marketplace } = parsePluginIdentifier(input)
  if (!name) return { ok: false, message: "Plugin name is required" }

  const found = await findMarketplacePlugin(name, marketplace)
  if ("error" in found) return { ok: false, message: found.error ?? "Plugin not found" }

  const spec = await resolveMarketplaceEntrySpec(found.match.entry, found.match.marketplace.root, found.match.marketplace.name)
  if ("error" in spec) {
    return { ok: false, message: spec.error, unsupported: spec.unsupported === true }
  }

  const install = await installPlugin(spec.spec)
  if (!install.ok) {
    return { ok: false, message: `Install failed for ${name}` }
  }

  const manifest = await readPluginManifest(install.target)
  if (!manifest.ok) {
    return { ok: false, message: `Installed "${name}" but could not read plugin manifest` }
  }

  const patch = await patchPluginConfig({
    spec: spec.configSpec,
    targets: manifest.targets,
    force: ctx.force,
    global: ctx.global,
    vcs: ctx.vcs,
    worktree: ctx.worktree,
    directory: ctx.directory,
    config: ctx.config,
  })

  if (!patch.ok) {
    return { ok: false, message: `Installed files for "${name}" but failed to update config` }
  }

  const tui = manifest.targets.some((item) => item.kind === "tui")

  return {
    ok: true,
    spec: spec.configSpec,
    message: `Installed ${name} from ${found.match.marketplace.name}`,
    dir: patch.dir,
    tui,
  }
}

async function resolveMarketplaceEntrySpec(
  entry: { name: string; source: PluginEntrySource },
  marketplaceRoot: string,
  marketplaceName: string,
): Promise<{ spec: string; configSpec: string } | { error: string; unsupported?: boolean }> {
  const source = entry.source

  if (typeof source === "string") {
    const relative = source.replace(/^\.\//, "")
    const root = path.resolve(marketplaceRoot, relative)
    return materializeLocalPlugin(entry.name, root, marketplaceName)
  }

  if (typeof source === "object" && source !== null && "source" in source) {
    if (source.source === "npm") {
      return { spec: source.package, configSpec: source.package }
    }

    if (source.source === "github") {
      const url = githubGitUrl(source.repo)
      const root = await materializeGitDirectory({ url, ref: source.ref, subpath: source.path })
      if (typeof root === "object" && "error" in root) return root
      return materializeLocalPlugin(entry.name, root, marketplaceName)
    }

    if (source.source === "git" || source.source === "git-subdir") {
      const root = await materializeGitDirectory({
        url: source.url,
        ref: source.ref ?? ("sha" in source ? source.sha : undefined),
        subpath: "path" in source ? source.path : undefined,
      })
      if (typeof root === "object" && "error" in root) return root
      return materializeLocalPlugin(entry.name, root, marketplaceName)
    }

    if (source.source === "url") {
      const root = await materializeGitDirectory({ url: source.url, ref: source.ref ?? source.sha })
      if (typeof root === "object" && "error" in root) return root
      return materializeLocalPlugin(entry.name, root, marketplaceName)
    }
  }

  return {
    error: `Unsupported plugin source for Awakened. npm and local/git copies are supported.`,
    unsupported: true,
  }
}

async function materializeLocalPlugin(name: string, root: string, marketplaceName: string) {
  if (!(await Filesystem.exists(root))) {
    return { error: `Plugin path not found: ${root}`, unsupported: true }
  }

  const pkg = path.join(root, "package.json")
  if (await Filesystem.exists(pkg)) {
    const json = await Filesystem.readJson<Record<string, unknown>>(pkg)
    const npmName = typeof json.name === "string" && json.name.trim() ? json.name.trim() : undefined
    if (npmName) {
      return { spec: npmName, configSpec: npmName }
    }
  }

  const target = await resolveAwakenedPluginPath(root)
  if (!target) {
    return {
      error: `"${name}" is a Claude Code plugin bundle without Awakened server/tui entrypoints. Skills-only plugins are not installable as Awakened plugins yet.`,
      unsupported: true,
    }
  }

  const dest = localMarketplacePluginDir(marketplaceName, name)
  await mkdir(path.dirname(dest), { recursive: true })
  await cp(root, dest, { recursive: true, force: true })

  const spec = pathToFileURL(target.startsWith(root) ? path.join(dest, path.relative(root, target)) : target).href
  const resolved = await resolvePathPluginTarget(spec).catch(() => spec)
  return { spec: resolved, configSpec: resolved }
}

async function resolveAwakenedPluginPath(root: string) {
  const candidates = [
    "index.ts",
    "index.tsx",
    "index.js",
    "plugin.ts",
    "plugin.js",
    "dist/index.js",
    "dist/tui.js",
    "dist/server.js",
  ]

  for (const rel of candidates) {
    const file = path.join(root, rel)
    if (await Filesystem.exists(file)) return file
  }

  if (await Filesystem.exists(path.join(root, "package.json"))) return root
  return
}

async function materializeGitDirectory(input: { url: string; ref?: string; subpath?: string }): Promise<string | { error: string }> {
  const url = rewriteGithubCloneUrl(input.url)
  const key = Buffer.from(`${url}:${input.ref ?? ""}:${input.subpath ?? ""}`).toString("base64url")
  const cache = pluginSourceCacheDir(key)

  if (!(await Filesystem.exists(path.join(cache, ".git")))) {
    await mkdir(path.dirname(cache), { recursive: true })
    const cloneArgs = ["git", "clone", "--depth", "1"]
    if (input.ref) cloneArgs.push("--branch", input.ref)
    cloneArgs.push(url, cache)
    const result = await Process.run(cloneArgs, {
      nothrow: true,
      abort: AbortSignal.timeout(MARKETPLACE_GIT_CLONE_TIMEOUT_MS),
    })
    if (result.code !== 0) {
      const detail = result.stderr.toString().trim() || result.stdout.toString().trim()
      const message = `Failed to clone plugin source: ${detail || input.url}`
      if (/could not connect|unable to access|connection refused|timed out/i.test(detail)) {
        return { error: marketplaceNetworkHint(message) }
      }
      return { error: message }
    }
  }

  const root = input.subpath ? path.join(cache, input.subpath.replace(/^\.\//, "")) : cache
  if (!(await Filesystem.exists(root))) {
    return { error: `Plugin subdirectory not found: ${root}` }
  }
  return root
}

export function isMarketplacePluginSpec(spec: string) {
  if (isPathPluginSpec(spec)) return false
  if (spec.includes("/")) return false
  return spec.includes("@") || !spec.includes(".")
}

export async function resolveInstallSpec(spec: string, ctx: InstallCtx) {
  const trimmed = spec.trim()
  if (!trimmed) return { ok: false as const, message: "Plugin spec is required" }

  const { marketplace } = parsePluginIdentifier(trimmed)
  const tryMarketplace =
    Boolean(marketplace) ||
    (!trimmed.startsWith("@") && !trimmed.includes(".") && !isPathPluginSpec(trimmed) && !trimmed.includes("/"))

  if (tryMarketplace) {
    const out = await installFromMarketplace(trimmed, ctx)
    if (out.ok || out.unsupported) return out
    if (marketplace) return out
  }

  const install = await installPlugin(trimmed)
  if (!install.ok) return { ok: false as const, message: `Could not install "${trimmed}"` }

  const manifest = await readPluginManifest(install.target)
  if (!manifest.ok) return { ok: false as const, message: `Installed "${trimmed}" but could not read manifest` }

  const patch = await patchPluginConfig({
    spec: trimmed,
    targets: manifest.targets,
    force: ctx.force,
    global: ctx.global,
    vcs: ctx.vcs,
    worktree: ctx.worktree,
    directory: ctx.directory,
    config: ctx.config,
  })

  if (!patch.ok) return { ok: false as const, message: "Failed to update plugin config" }
  const tui = manifest.targets.some((item) => item.kind === "tui")
  return { ok: true as const, spec: trimmed, message: `Installed ${trimmed}`, dir: patch.dir, tui }
}

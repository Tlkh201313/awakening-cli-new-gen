import { intro, log, outro, spinner } from "@clack/prompts"
import { Effect } from "effect"
import { Global } from "@awakened-ai/core/global"
import { cmd } from "../cmd"
import { effectCmd, fail } from "../../effect-cmd"
import { InstanceRef } from "@/effect/instance-ref"
import { UI } from "../../ui"
import { createPlugTask } from "./install-shared"
import {
  addMarketplace,
  ensureDefaultMarketplaces,
  listMarketplaceNames,
  loadAllMarketplaces,
  loadMarketplace,
  parseMarketplaceInput,
  readKnownMarketplaces,
  removeMarketplace,
  resolveInstallSpec,
  updateMarketplace,
} from "@/plugin/marketplace"

const ShorthandInstallCommand = effectCmd({
  command: "$0 <spec>",
  describe: "install plugin from npm or marketplace (shorthand)",
  builder: (yargs) =>
    yargs
      .positional("spec", {
        type: "string",
        describe: "npm package or plugin@marketplace",
      })
      .option("global", {
        alias: ["g"],
        type: "boolean",
        default: false,
      })
      .option("force", {
        alias: ["f"],
        type: "boolean",
        default: false,
      }),
  handler: Effect.fn("Cli.plugin.shorthand")(function* (args) {
    const spec = String(args.spec ?? "").trim()
    if (!spec) return yield* fail("spec is required")

    const ctx = yield* InstanceRef
    if (!ctx) return

    UI.empty()
    intro(`Install plugin ${spec}`)

    const marketplaceLike = spec.includes("@") || (!spec.includes(".") && !spec.startsWith("@") && !spec.startsWith("file://"))

    if (marketplaceLike) {
      const spin = spinner()
      spin.start("Installing from marketplace...")
      const out = yield* Effect.promise(() =>
        resolveInstallSpec(spec, {
          global: Boolean(args.global),
          force: Boolean(args.force),
          vcs: ctx.project.vcs,
          worktree: ctx.worktree,
          directory: ctx.directory,
          config: Global.Path.config,
        }),
      )
      spin.stop(out.ok ? "Installed" : "Install failed", out.ok ? 0 : 1)
      if (!out.ok) {
        log.error(out.message)
        process.exitCode = 1
        outro("Done")
        return
      }
      log.success(out.message)
      outro("Done")
      return
    }

    const run = createPlugTask({
      mod: spec,
      global: Boolean(args.global),
      force: Boolean(args.force),
    })
    const ok = yield* Effect.promise(() =>
      run({
        vcs: ctx.project.vcs,
        worktree: ctx.worktree,
        directory: ctx.directory,
      }),
    )
    outro("Done")
    if (!ok) process.exitCode = 1
  }),
})

const InstallCommand = effectCmd({
  command: "install <spec>",
  aliases: ["i"],
  describe: "install a plugin from npm or marketplace",
  builder: (yargs) =>
    yargs
      .positional("spec", { type: "string" })
      .option("global", { alias: ["g"], type: "boolean", default: false })
      .option("force", { alias: ["f"], type: "boolean", default: false }),
  handler: Effect.fn("Cli.plugin.install")(function* (args) {
    const spec = String(args.spec ?? "").trim()
    if (!spec) return yield* fail("spec is required")
    const ctx = yield* InstanceRef
    if (!ctx) return
    UI.empty()
    intro(`Install plugin ${spec}`)
    const out = yield* Effect.promise(() =>
      resolveInstallSpec(spec, {
        global: Boolean(args.global),
        force: Boolean(args.force),
        vcs: ctx.project.vcs,
        worktree: ctx.worktree,
        directory: ctx.directory,
        config: Global.Path.config,
      }),
    )
    if (!out.ok) {
      log.error(out.message)
      process.exitCode = 1
    } else {
      log.success(out.message)
    }
    outro("Done")
  }),
})

const ListCommand = effectCmd({
  command: "list",
  aliases: ["ls"],
  describe: "list marketplaces and optionally available plugins",
  builder: (yargs) => yargs.option("available", { type: "boolean", default: false }),
  handler: Effect.fn("Cli.plugin.list")(function* (args) {
    yield* Effect.promise(() => ensureDefaultMarketplaces())
    console.log("Marketplaces:")
    for (const name of yield* Effect.promise(() => listMarketplaceNames())) {
      console.log(`- ${name}`)
    }
    if (!args.available) return
    const { loaded, errors } = yield* Effect.promise(() => loadAllMarketplaces())
    for (const item of errors) console.log(`  ! ${item.name}: ${item.error}`)
    for (const item of loaded) {
      console.log(`\n${item.marketplace.name} (${item.marketplace.plugins.length} plugins)`)
      for (const plugin of item.marketplace.plugins.slice(0, 40)) {
        const desc = plugin.description ? `: ${plugin.description}` : ""
        console.log(`  - ${plugin.name}${desc}`)
      }
    }
  }),
})

const MarketplaceAddCommand = effectCmd({
  command: "add <source>",
  describe: "add marketplace (owner/repo, URL, or path)",
  builder: (yargs) => yargs.positional("source", { type: "string" }),
  handler: Effect.fn("Cli.plugin.marketplace.add")(function* (args) {
    const sourceInput = String(args.source ?? "").trim()
    if (!sourceInput) return yield* fail("source is required")
    const parsed = yield* Effect.promise(() => parseMarketplaceInput(sourceInput))
    if (!parsed) return yield* fail(`Unrecognized marketplace source: ${sourceInput}`)
    if ("error" in parsed) return yield* fail(parsed.error)

    const loaded = yield* Effect.promise(async () => {
      const temp = `__temp-${Date.now()}`
      await addMarketplace(temp, parsed)
      const manifest = await loadMarketplace(temp, true)
      await removeMarketplace(temp)
      if ("error" in manifest) return { ok: false as const, message: manifest.error }
      const final = await addMarketplace(manifest.marketplace.name, parsed)
      if (!final.ok) return final
      return { ok: true as const, name: manifest.marketplace.name, count: manifest.marketplace.plugins.length }
    })

    if (!loaded.ok) return yield* fail(loaded.message)
    log.success(`Added marketplace "${loaded.name}" (${loaded.count} plugins)`)
  }),
})

const MarketplaceListCommand = effectCmd({
  command: "list",
  aliases: ["ls"],
  describe: "list configured marketplaces",
  handler: Effect.fn("Cli.plugin.marketplace.list")(function* () {
    yield* Effect.promise(() => ensureDefaultMarketplaces())
    const data = yield* Effect.promise(() => readKnownMarketplaces())
    for (const [name, entry] of Object.entries(data)) {
      const source =
        entry.source.source === "github"
          ? entry.source.repo
          : entry.source.source === "git"
            ? entry.source.url
            : entry.source.source === "url"
              ? entry.source.url
              : "path" in entry.source
                ? entry.source.path
                : JSON.stringify(entry.source)
      console.log(`${name}\t${source}`)
    }
  }),
})

const MarketplaceRemoveCommand = effectCmd({
  command: "remove <name>",
  aliases: ["rm"],
  describe: "remove a marketplace",
  builder: (yargs) => yargs.positional("name", { type: "string" }),
  handler: Effect.fn("Cli.plugin.marketplace.remove")(function* (args) {
    const name = String(args.name ?? "").trim()
    if (!name) return yield* fail("name is required")
    const out = yield* Effect.promise(() => removeMarketplace(name))
    if (!out.ok) return yield* fail(out.message)
    log.success(`Removed marketplace "${name}"`)
  }),
})

const MarketplaceUpdateCommand = effectCmd({
  command: "update [name]",
  describe: "refresh marketplace cache",
  builder: (yargs) => yargs.positional("name", { type: "string" }),
  handler: Effect.fn("Cli.plugin.marketplace.update")(function* (args) {
    const name = args.name ? String(args.name).trim() : undefined
    const out = yield* Effect.promise(() => updateMarketplace(name))
    for (const item of out) {
      if (item.ok) log.success(item.message)
      else log.error(`${item.name}: ${item.message}`)
    }
  }),
})

const MarketplaceCommand = cmd({
  command: "marketplace",
  describe: "manage Claude Code-compatible plugin marketplaces",
  builder: (yargs) =>
    yargs
      .command(MarketplaceAddCommand)
      .command(MarketplaceListCommand)
      .command(MarketplaceRemoveCommand)
      .command(MarketplaceUpdateCommand)
      .demandCommand(),
  handler() {},
})

export const PluginCommand = cmd({
  command: "plugin",
  aliases: ["plug"],
  describe: "install and manage Awakened plugins",
  builder: (yargs) =>
    yargs
      .command(ShorthandInstallCommand)
      .command(InstallCommand)
      .command(ListCommand)
      .command(MarketplaceCommand)
      .demandCommand(0),
  handler() {},
})

export { createPlugTask } from "./install-shared"

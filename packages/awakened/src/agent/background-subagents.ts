import type { Config } from "@/config/config"
import type { RuntimeFlags } from "@/effect/runtime-flags"

export function enabled(flags: RuntimeFlags.Info, cfg: Config.Info) {
  return flags.experimentalBackgroundSubagents || cfg.awakenedCapabilities?.backgroundSubagents === true
}

export function preferBackground(cfg: Config.Info) {
  if (cfg.awakenedCapabilities?.preferBackgroundSubagents === false) return false
  return (
    cfg.awakenedCapabilities?.preferBackgroundSubagents === true ||
    cfg.awakenedCapabilities?.backgroundSubagents === true
  )
}

export * as BackgroundSubagents from "./background-subagents"

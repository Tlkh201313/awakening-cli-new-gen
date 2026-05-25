export * from "./presets"
export * from "./instructions"
export * as PersonalityStore from "./store"

import type { Info as ConfigInfo } from "@/config/config"
import * as PersonalityStore from "./store"

export function getActivePersonalityId(cfg: ConfigInfo) {
  const active = cfg.awakenedPersonality?.active
  if (active === undefined || active === null || active === "") return "default"
  return active
}

export async function resolveActivePersonalityPrompt(cfg: ConfigInfo, worktree: string) {
  const id = getActivePersonalityId(cfg)
  return PersonalityStore.resolvePrompt(id, worktree)
}

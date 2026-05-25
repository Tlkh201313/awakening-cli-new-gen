import { bootstrapMatch } from "./heuristics"
import type { AutoCapabilityContext } from "./types"

export function primaryBootstrap(ctx: AutoCapabilityContext) {
  if (ctx.bootstrap !== true) return false
  if (ctx.autoCapabilities === false) return false
  if (ctx.agentMode !== "primary") return false
  return bootstrapMatch(ctx.userText)
}

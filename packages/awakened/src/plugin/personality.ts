import type { Hooks, PluginInput } from "@awakened-ai/plugin"
import type { Info as ConfigInfo } from "@/config/config"
import { getActivePersonalityId, resolveActivePersonalityPrompt } from "@/personality"
import { PERSONALITY_AI_INSTRUCTIONS } from "@/personality/instructions"

async function loadPersonalityPrompt(input: PluginInput) {
  try {
    const response = await input.client.config.get()
    const cfg = (response.data ?? {}) as ConfigInfo
    const id = getActivePersonalityId(cfg)
    if (id === "default") return ""
    const prompt = await resolveActivePersonalityPrompt(cfg, input.worktree)
    if (!prompt) return ""
    return [
      "# Awakened personality (active)",
      "",
      `Preset: **${id}**`,
      "",
      "## How to apply",
      "",
      PERSONALITY_AI_INSTRUCTIONS,
      "",
      "## Preset instructions",
      "",
      prompt,
    ].join("\n")
  } catch {
    return ""
  }
}

export async function AwakenedPersonalityPlugin(input: PluginInput): Promise<Hooks> {
  return {
    "experimental.chat.system.transform": async (_hookInput, output) => {
      const block = await loadPersonalityPrompt(input)
      if (!block) return
      output.system.push(block)
    },
  }
}

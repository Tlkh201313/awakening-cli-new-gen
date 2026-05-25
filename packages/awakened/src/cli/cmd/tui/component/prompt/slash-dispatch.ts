import { dispatchPluginSlash } from "../../feature-plugins/system/plugins"
import { dispatchMemorySlash } from "../../feature-plugins/system/memory"
import { dispatchPersonalitySlash } from "../../feature-plugins/system/personality"
import { dispatchPermissionSlash } from "../../feature-plugins/system/permission-bypass"
import type { OpenTuiKeymap } from "../../keymap"

export function parsePromptSlash(input: string) {
  const firstLineEnd = input.indexOf("\n")
  const firstLine = firstLineEnd === -1 ? input : input.slice(0, firstLineEnd)
  const [raw, ...firstLineArgs] = firstLine.split(" ")
  if (!raw.startsWith("/")) return
  const name = raw.slice(1)
  if (!name) return
  const restOfInput = firstLineEnd === -1 ? "" : input.slice(firstLineEnd + 1)
  const args = firstLineArgs.join(" ") + (restOfInput ? "\n" + restOfInput : "")
  return { name, args }
}

export function dispatchPromptSlash(keymap: OpenTuiKeymap, name: string, args?: string) {
  if (dispatchPermissionSlash(name, args)) return true
  if (dispatchMemorySlash(name, args)) return true
  if (dispatchPersonalitySlash(name, args)) return true
  if (dispatchPluginSlash(name, args)) return true

  for (const entry of keymap.getCommandEntries({ visibility: "reachable" })) {
    const slashName = entry.command.slashName
    if (typeof slashName !== "string" || !slashName) continue
    const names = [slashName]
    const aliases = entry.command.slashAliases
    if (Array.isArray(aliases)) {
      for (const alias of aliases) {
        if (typeof alias === "string") names.push(alias)
      }
    }
    if (!names.includes(name)) continue
    keymap.dispatchCommand(entry.command.name)
    return true
  }

  return false
}

import { dispatchPluginSlash } from "../../feature-plugins/system/plugins"
import { dispatchMemorySlash } from "../../feature-plugins/system/memory"
import { dispatchPersonalitySlash } from "../../feature-plugins/system/personality"
import { dispatchPermissionSlash } from "../../feature-plugins/system/permission-bypass"
import { dispatchVoiceSlash } from "../../util/voice/controller"
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

function collectSlashNames(keymap: OpenTuiKeymap): string[] {
  const names: string[] = []
  for (const entry of keymap.getCommandEntries({ visibility: "reachable" })) {
    const slashName = entry.command.slashName
    if (typeof slashName === "string" && slashName) names.push(slashName)
    const aliases = entry.command.slashAliases
    if (Array.isArray(aliases)) {
      for (const alias of aliases) {
        if (typeof alias === "string") names.push(alias)
      }
    }
    const slash = entry.command.slash as { name?: string; aliases?: string[] } | undefined
    if (slash) {
      if (typeof slash.name === "string" && slash.name) names.push(slash.name)
      if (Array.isArray(slash.aliases)) {
        for (const alias of slash.aliases) {
          if (typeof alias === "string") names.push(alias)
        }
      }
    }
  }
  return names
}

function levenshtein(a: string, b: string): number {
  if (a === "") return b.length
  if (b === "") return a.length
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    }
  }
  return matrix[a.length][b.length]
}

export function findClosestSlash(keymap: OpenTuiKeymap, name: string): string | undefined {
  const names = collectSlashNames(keymap)
  let best: string | undefined
  let bestDist = 3
  for (const candidate of names) {
    const dist = levenshtein(name, candidate)
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }
  return best
}

export function dispatchPromptSlash(keymap: OpenTuiKeymap, name: string, args?: string) {
  if (dispatchPermissionSlash(name, args)) return true
  if (dispatchVoiceSlash(name, args)) return true
  if (dispatchMemorySlash(name, args)) return true
  if (dispatchPersonalitySlash(name, args)) return true
  if (dispatchPluginSlash(name, args)) return true

  for (const entry of keymap.getCommandEntries({ visibility: "reachable" })) {
    const slashName = entry.command.slashName
    const aliases = entry.command.slashAliases
    const slash = entry.command.slash as { name?: string; aliases?: string[] } | undefined

    const names: string[] = []
    if (typeof slashName === "string" && slashName) names.push(slashName)
    if (Array.isArray(aliases)) {
      for (const alias of aliases) {
        if (typeof alias === "string") names.push(alias)
      }
    }
    if (slash) {
      if (typeof slash.name === "string" && slash.name) names.push(slash.name)
      if (Array.isArray(slash.aliases)) {
        for (const alias of slash.aliases) {
          if (typeof alias === "string") names.push(alias)
        }
      }
    }

    if (!names.includes(name)) continue
    keymap.dispatchCommand(entry.command.name)
    return true
  }

  return false
}

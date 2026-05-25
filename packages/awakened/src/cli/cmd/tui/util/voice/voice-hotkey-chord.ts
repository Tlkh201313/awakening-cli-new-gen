import type { KeyEvent } from "@opentui/core"
import type { Binding } from "@opentui/keymap"
import type { Renderable } from "@opentui/core"

export type VoiceChord = {
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  super: boolean
}

export function parseVoiceChord(raw: string): VoiceChord | undefined {
  const parts = raw
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
  if (!parts.length) return undefined
  const key = parts[parts.length - 1]
  if (!key) return undefined
  return {
    key,
    ctrl: parts.includes("ctrl"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
    super: parts.includes("super") || parts.includes("win"),
  }
}

export function voiceChordsFromBindings(bindings: readonly Binding<Renderable, KeyEvent>[]) {
  const chords: VoiceChord[] = []
  for (const binding of bindings) {
    const raw = typeof binding.key === "string" ? binding.key : binding.key?.name
    if (!raw) continue
    for (const part of raw.split(",")) {
      const chord = parseVoiceChord(part.trim())
      if (chord) chords.push(chord)
    }
  }
  return chords
}

function modifierMatch(event: KeyEvent, chord: VoiceChord) {
  return (
    Boolean(event.ctrl) === chord.ctrl &&
    Boolean(event.meta) === chord.alt &&
    Boolean(event.shift) === chord.shift &&
    Boolean(event.super) === chord.super
  )
}

export function voiceToggleChordActive(event: KeyEvent, chords: VoiceChord[]) {
  const name = event.name.toLowerCase()
  return chords.some((chord) => chord.key === name && modifierMatch(event, chord))
}
